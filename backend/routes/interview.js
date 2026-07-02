const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const Resume = require('../models/Resume');
const UserProgress = require('../models/UserProgress');
const { generateEmbedding } = require('../utils/embeddings');
const { queryResumeChunks } = require('../utils/pinecone');

// Helper for Groq API
const callGroq = async (systemPrompt, userPrompt) => {
    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile', // Upgraded for better instruction following
                messages: [
                    { 
                        role: 'system', 
                        content: systemPrompt + ' IMPORTANT: You MUST return a valid JSON object. Do not include any text outside the JSON.' 
                    },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: "json_object" }
            },
            {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
            }
        );
        const content = response.data.choices[0].message.content;
        return JSON.parse(content);
    } catch (err) {
        console.error('Groq API Error:', err.response?.data || err.message);
        throw err;
    }
};

// @route   POST api/interview/start
// @desc    Start multi-agent adaptive interview with memory
router.post('/start', auth, async (req, res) => {
    const { customPrompt } = req.body;
    try {
        console.log('Starting advanced interview for user:', req.user.id);
        const resume = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        
        if (!resume) {
            return res.status(400).json({ error: 'Please upload your resume first.' });
        }

        let progress = await UserProgress.findOne({ user: req.user.id });
        if (!progress) {
            progress = new UserProgress({ user: req.user.id });
            await progress.save();
        }

        let context = "";
        try {
            const queryText = customPrompt || "core skills, projects, and work experience";
            const queryVector = await generateEmbedding(queryText);
            const matches = await queryResumeChunks(queryVector, 5, { userId: req.user.id });
            context = matches.map(m => m.metadata.text).join('\n---\n');
        } catch (pinErr) {
            console.error('Pinecone context retrieval error, falling back to basic substring:', pinErr.message);
            context = resume.originalText ? resume.originalText.substring(0, 3000) : "No detailed resume context.";
        }
        if (!context) {
            context = resume.originalText ? resume.originalText.substring(0, 3000) : "No detailed resume context.";
        }

        const interviewerPrompt = `You are an elite Technical Interviewer Agent. 
        Your goal is to welcome the candidate warmly, introduce yourself, and ask the candidate to introduce themselves, sharing their background, experience, and key projects.
        Refer to the candidate's resume/profile details in the context if helpful to make it personalized, but keep it brief.
        Do not ask technical questions yet; this is the initial ice-breaker/introduction step.
        Return JSON format: { "question": string, "topic": "Introduction" }`;

        const result = await callGroq(interviewerPrompt, `Context: ${context}\nGenerate a personalized welcome and request for self-introduction in JSON format.`);

        const newSession = new Session({
            userId: req.user.id,
            questions: [result.question],
            topicLabels: [result.topic],
            answers: [],
            evaluations: [],
            scores: [],
            confidences: [],
            currentStep: 0,
            status: 'active',
            customPrompt: customPrompt || ''
        });

        const session = await newSession.save();
        res.json(session);
    } catch (err) {
        console.error('INTERVIEW START ERROR:', err.message);
        res.status(500).json({ error: 'Failed to start interview', details: err.message });
    }
});

// @route   POST api/interview/answer
// @desc    Multi-agent evaluation (Evaluator + Coach) and next question generation
router.post('/answer', auth, async (req, res) => {
    const { sessionId, answer, responseTime } = req.body;

    try {
        const session = await Session.findById(sessionId);
        if (!session) return res.status(404).json({ msg: 'Session not found' });

        const currentQuestion = session.questions[session.currentStep];
        const currentTopic = session.topicLabels[session.currentStep];
        const customPrompt = session.customPrompt;

        // 1. Evaluator Agent: Scores the answer
        let evaluatorPrompt;
        let coachPrompt;

        if (currentTopic === 'Introduction') {
            evaluatorPrompt = `You are an Interview Evaluator Agent. 
            Analyze the candidate's self-introduction. Evaluate their communication skill, clarity, confidence, structure, and how well they highlight their relevant experience based on the resume.
            Return JSON: { "score": number (1-10), "confidence": number (1-10), "mistakes": [string], "topic": "Introduction" }`;

            coachPrompt = `You are an Interview Coach Agent. 
            Based on the self-introduction evaluation, provide constructive feedback on their presentation, clarity, and key projects/skills mentioned. Suggest how they can improve their introduction.
            Return JSON: { "feedback": string, "suggestions": [string] }`;
        } else {
            evaluatorPrompt = `You are a Technical Evaluator Agent. 
            Analyze the answer for: logic correctness, technical depth, and accuracy.
            ${customPrompt ? `Keep in mind the interview focus was: "${customPrompt}".` : ""}
            Return JSON: { "score": number (1-10), "confidence": number (1-10), "mistakes": [string], "topic": string }`;

            coachPrompt = `You are an Interview Coach Agent. 
            Based on the evaluation and the answer, provide constructive feedback and suggestions for improvement.
            Return JSON: { "feedback": string, "suggestions": [string] }`;
        }

        const evaluationResult = await callGroq(evaluatorPrompt, `Question: ${currentQuestion}\nAnswer: ${answer}`);

        // 2. Coach Agent: Provides feedback
        const coachResult = await callGroq(coachPrompt, `Question: ${currentQuestion}\nAnswer: ${answer}\nScore: ${evaluationResult.score}/10\nMistakes: ${evaluationResult.mistakes.join(', ')}`);

        // Update Session
        session.answers.push(answer);
        session.evaluations.push(`${coachResult.feedback}\n\nSuggestions: ${coachResult.suggestions.join(', ')}`);
        session.scores.push(evaluationResult.score);
        session.confidences.push(evaluationResult.confidence);
        session.responseTimes.push(responseTime || 0);

        // Update User Progress (Memory)
        let progress = await UserProgress.findOne({ user: req.user.id });
        if (!progress) progress = new UserProgress({ user: req.user.id });

        if (evaluationResult.score >= 8) {
            if (!progress.strongTopics.includes(currentTopic)) progress.strongTopics.push(currentTopic);
            progress.weakTopics = progress.weakTopics.filter(t => t !== currentTopic);
        } else if (evaluationResult.score <= 5) {
            if (!progress.weakTopics.includes(currentTopic)) progress.weakTopics.push(currentTopic);
            progress.strongTopics = progress.strongTopics.filter(t => t !== currentTopic);
        }
        
        progress.lastAccessed = Date.now();
        await progress.save();

        // 3. Generate next question or complete
        if (session.questions.length < 6) {
            const interviewerPrompt = `You are an elite Technical Interviewer Agent. 
            ${currentTopic === 'Introduction' ? "Generate the FIRST technical question based on the candidate's self-introduction and their resume context." : "Generate the NEXT technical question. Increase difficulty if the previous score was high, or provide a follow-up."}
            ${customPrompt ? `IMPORTANT: The interview focus is: "${customPrompt}". All questions MUST strictly adhere to this focus.` : ""}
            Use User Progress: Weak: ${progress.weakTopics.join(', ')}, Strong: ${progress.strongTopics.join(', ')}.
            Return JSON: { "question": string, "topic": string }`;

            const nextQResult = await callGroq(interviewerPrompt, `Previous Q: ${currentQuestion}\nPrevious A: ${answer}\nScore: ${evaluationResult.score}`);
            
            session.questions.push(nextQResult.question);
            session.topicLabels.push(nextQResult.topic);
            session.currentStep++;
            await session.save();

            res.json({ 
                evaluation: coachResult.feedback, 
                score: evaluationResult.score, 
                suggestions: coachResult.suggestions,
                nextQuestion: nextQResult.question, 
                status: 'active' 
            });
        } else {
            session.status = 'completed';
            
            // Add to progress history
            const avgScore = session.scores.reduce((a, b) => a + b, 0) / session.scores.length;
            progress.history.push({ sessionId: session._id, score: avgScore });
            await progress.save();
            
            await session.save();
            res.json({ 
                evaluation: coachResult.feedback, 
                score: evaluationResult.score, 
                suggestions: coachResult.suggestions,
                status: 'completed' 
            });
        }
    } catch (err) {
        console.error('INTERVIEW ANSWER ERROR:', err.message);
        res.status(500).json({ error: 'Server error during interview processing' });
    }
});

// @route   GET api/interview/sessions
// @desc    Get all interview sessions for user
router.get('/sessions/all', auth, async (req, res) => {
    try {
        const sessions = await Session.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(sessions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/interview/:id
// @desc    Get session details
router.get('/:id', auth, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ msg: 'Session not found' });
        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/interview/tts
// @desc    Convert text to speech using OpenAI or ElevenLabs
router.post('/tts', auth, async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    // 1. Check ElevenLabs config
    if (process.env.ELEVENLABS_API_KEY) {
        try {
            const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel (default)
            const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
            const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                    text: text,
                    model_id: modelId
                },
                {
                    headers: {
                        'xi-api-key': process.env.ELEVENLABS_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream'
                }
            );
            res.set('Content-Type', 'audio/mpeg');
            return response.data.pipe(res);
        } catch (err) {
            // Enhanced logging to capture detailed ElevenLabs errors (such as free tier constraints or payment requirements)
            if (err.response && err.response.data) {
                // If it is a stream response, we might need to read it as a string to print
                try {
                    // responseType was 'stream', so the error data is a readable stream or buffer
                    let errorBody = '';
                    if (typeof err.response.data.on === 'function') {
                        errorBody = await new Promise((resolve) => {
                            let chunks = [];
                            err.response.data.on('data', chunk => chunks.push(chunk));
                            err.response.data.on('end', () => resolve(Buffer.concat(chunks).toString()));
                            err.response.data.on('error', () => resolve('[Stream Error]'));
                        });
                    } else {
                        errorBody = JSON.stringify(err.response.data);
                    }
                    console.error(`ElevenLabs TTS Error (${err.response.status}):`, errorBody);
                } catch (e) {
                    console.error('ElevenLabs TTS Error (failed to parse stream error):', err.message);
                }
            } else {
                console.error('ElevenLabs TTS Error:', err.message);
            }
            // Fall through to OpenAI if ElevenLabs fails
        }
    }

    // 2. Check OpenAI config
    if (process.env.OPENAI_API_KEY) {
        try {
            const voice = process.env.OPENAI_VOICE || 'alloy';
            const response = await axios.post(
                'https://api.openai.com/v1/audio/speech',
                {
                    model: 'tts-1',
                    input: text,
                    voice: voice
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream'
                }
            );
            res.set('Content-Type', 'audio/mpeg');
            return response.data.pipe(res);
        } catch (err) {
            console.error('OpenAI TTS Error:', err.message);
        }
    }

    // If neither is configured
    return res.status(450).json({ error: 'No Neural TTS provider configured' });
});

module.exports = router;
