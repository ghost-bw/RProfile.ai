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
        Your goal is to ask concise technical questions.
        ${customPrompt ? `The user has requested a specific focus: "${customPrompt}". Prioritize questions related to this focus.` : ""}
        Return JSON format: { "question": string, "topic": string }
        Ensure the question is relevant to the user's field.`;

        const result = await callGroq(interviewerPrompt, `Context: ${context}\nGenerate the first interview question in JSON format.`);

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
        const evaluatorPrompt = `You are a Technical Evaluator Agent. 
        Analyze the answer for: logic correctness, technical depth, and accuracy.
        ${customPrompt ? `Keep in mind the interview focus was: "${customPrompt}".` : ""}
        Return JSON: { "score": number (1-10), "confidence": number (1-10), "mistakes": [string], "topic": string }`;

        const evaluationResult = await callGroq(evaluatorPrompt, `Question: ${currentQuestion}\nAnswer: ${answer}`);

        // 2. Coach Agent: Provides feedback
        const coachPrompt = `You are an Interview Coach Agent. 
        Based on the evaluation and the answer, provide constructive feedback and suggestions for improvement.
        Return JSON: { "feedback": string, "suggestions": [string] }`;

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
        if (session.questions.length < 5) {
            const interviewerPrompt = `You are an elite Technical Interviewer Agent. 
            Generate the NEXT question. Increase difficulty if the previous score was high, or provide a follow-up.
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

module.exports = router;
