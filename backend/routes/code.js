const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const UserProgress = require('../models/UserProgress');

// @route   POST api/code/run
// @desc    Run code using AI simulation or Judge0
router.post('/run', auth, async (req, res) => {
    const { code, language } = req.body;

    const languageIds = {
        'javascript': 63,
        'python': 71,
        'java': 62,
        'cpp': 54
    };

    const languageId = languageIds[language] || 63;

    try {
        if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'SIGN-UP-FOR-KEY') {
            const simulationResponse = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { 
                            role: 'system', 
                            content: `You are a high-performance, deterministic code execution engine. 
                            Your task is to "run" the provided code and return exactly what the terminal would output.
                            Return JSON: { "stdout": string, "stderr": string, "status": { "id": number, "description": string } }` 
                        },
                        { role: 'user', content: `Language: ${language}\nCode:\n${code}` }
                    ],
                    temperature: 0,
                    response_format: { type: "json_object" }
                },
                {
                    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
                }
            );

            const result = JSON.parse(simulationResponse.data.choices[0].message.content);
            return res.json({
                stdout: result.stdout || "",
                stderr: result.stderr || "",
                time: "0.010",
                memory: 256,
                status: result.status || { id: 3, description: "Accepted" }
            });
        }

        const options = {
            method: 'POST',
            url: 'https://judge0-ce.p.rapidapi.com/submissions',
            params: { base64_encoded: 'false', wait: 'true' },
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            },
            data: {
                language_id: languageId,
                source_code: code,
                stdin: ''
            }
        };

        const response = await axios.request(options);
        res.json(response.data);
    } catch (err) {
        console.error('CODE RUN ERROR:', err.message);
        res.status(500).json({ error: 'Error executing code' });
    }
});

// @route   GET api/code/generate-problem
// @desc    Generate a DSA problem using AI (search or random)
router.get('/generate-problem', auth, async (req, res) => {
    const { query } = req.query;
    try {
        const promptContent = query 
            ? `STRICT REQUIREMENT: Generate a high-quality DSA problem about: "${query}". Ensure the problem is technically sound and follows standard interview formats.`
            : 'Generate a random high-quality DSA problem ranging from easy to hard.';

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { 
                        role: 'system', 
                        content: `You are a Senior Coding Interviewer. Generate a high-quality DSA problem.
                        You MUST output valid JSON.
                        Structure: { "title": string, "description": string, "difficulty": string, "constraints": [string], "example": string, "functionName": string, "defaultCode": { "javascript": string, "python": string, "cpp": string, "java": string } }` 
                    },
                    { role: 'user', content: promptContent }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            },
            {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
            }
        );

        const problem = JSON.parse(response.data.choices[0].message.content);
        res.json(problem);
    } catch (err) {
        console.error('AI ERROR:', err.response?.data || err.message);
        let errorMessage = err.message;
        if (err.response?.data?.error?.message) {
            errorMessage = err.response.data.error.message;
        } else if (err.response?.data) {
            errorMessage = typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data;
        }
        res.status(500).json({ error: 'Error in AI operation', details: errorMessage });
    }
});

// @route   POST api/code/evaluate
// @desc    AI evaluates code and records progress on successful submission
router.post('/evaluate', auth, async (req, res) => {
    const { problem, code, language, isSubmit } = req.body;

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { 
                        role: 'system', 
                        content: `You are an ELITE Competitive Programming Judge. Deterministic and extremely strict.
                        
                        CRITERIA FOR "passedAll":
                        - True ONLY IF 100% SUCCESSFUL on 15+ diverse test cases.
                        - Complexity must be optimal.
                        - Score is 10.0 ONLY for perfect solutions.
                        - Score MUST be below 5.0 for any logic error.
                        
                        Return JSON: { 
                            "correctness": string, 
                            "complexity": string, 
                            "improvements": [string], 
                            "score": number,
                            "passedAll": boolean
                        }` 
                    },
                    { role: 'user', content: `Problem: ${JSON.stringify(problem)}\nLanguage: ${language}\nCode:\n${code}\nAction: ${isSubmit ? 'Full Submission' : 'Test Run'}` }
                ],
                temperature: 0,
                response_format: { type: "json_object" }
            },
            {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
            }
        );

        const evaluation = JSON.parse(response.data.choices[0].message.content);

        if (isSubmit && evaluation.passedAll) {
            try {
                let progress = await UserProgress.findOne({ user: req.user.id });
                if (!progress) {
                    progress = new UserProgress({ user: req.user.id, solvedProblems: [] });
                }
                const alreadySolved = progress.solvedProblems.find(p => p.title === problem.title);
                if (!alreadySolved) {
                    progress.solvedProblems.push({
                        title: problem.title,
                        difficulty: problem.difficulty || 'Medium',
                        solvedAt: new Date()
                    });
                    await progress.save();
                }
            } catch (progErr) {
                console.error('PROGRESS UPDATE ERROR:', progErr.message);
            }
        }

        res.json(evaluation);
    } catch (err) {
        console.error('AI EVALUATION ERROR:', err.response?.data || err.message);
        let errorMessage = err.message;
        if (err.response?.data?.error?.message) {
            errorMessage = err.response.data.error.message;
        } else if (err.response?.data) {
            errorMessage = typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data;
        }
        res.status(500).json({ error: 'Error evaluating code', details: errorMessage });
    }
});

// @route   GET api/code/generate-aptitude
// @desc    Generate 15 aptitude questions using AI
router.get('/generate-aptitude', auth, async (req, res) => {
    let jobRoleContext = "Software Engineering";
    try {
        const Resume = require('../models/Resume');
        const resume = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        if (resume && resume.originalText) {
            jobRoleContext = resume.originalText.substring(0, 1000);
        }
    } catch (dbErr) {
        console.error('DB ERROR DURING APTITUDE CONTEXT FETCH:', dbErr.message);
        // Continue with default context
    }

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { 
                        role: 'system', 
                        content: `You are a High-Accuracy Exam Auditor. 
                        TASK: Generate 20 technical aptitude MCQs in JSON format.
                        
                        PRECISION RULES:
                        1. The "correctAnswer" index (0-3) MUST point to the EXACT correct string in the "options" array.
                        2. Verify the logic: If the question is math, solve it. If verbal, check grammar.
                        3. CATEGORIES: Quantitative (30%), Logical (30%), Verbal (25%), Business (15%).
                        
                        OUTPUT STRUCTURE:
                        { "questions": [ { "question": "", "options": ["A","B","C","D"], "correctAnswer": 0-3, "topic": "", "explanation": "" } ] }
                        Ensure the output is a valid JSON object.` 
                    },
                    { role: 'user', content: `Generate 20 diverse, unique MCQs. Double-check that for EVERY question, the correctAnswer index correctly matches the true answer among the options.` }
                ],
                temperature: 0.4, // Lower temperature for higher accuracy/determinism
                response_format: { type: "json_object" }
            },
            {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                timeout: 60000
            }
        );

        const result = JSON.parse(response.data.choices[0].message.content);
        let rawQuestions = result.questions || result;
        
        if (!Array.isArray(rawQuestions)) return res.json([]);

        // CLEANING & VERIFICATION LAYER
        const verifiedQuestions = rawQuestions.map(q => {
            let correctIdx = q.correctAnswer;
            
            // 1. Normalize index (Handle letters or 1-based indexing)
            if (typeof correctIdx === 'string') {
                const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, '1': 0, '2': 1, '3': 2, '4': 3, '0': 0 };
                const clean = correctIdx.trim().toUpperCase();
                correctIdx = map[clean] !== undefined ? map[clean] : (parseInt(clean) || 0);
            }
            
            // 2. Cross-reference Explanation with Options (Safety check)
            // If the explanation explicitly mentions an option text, ensure correctIdx points to it
            const explanation = (q.explanation || "").toLowerCase();
            const options = q.options || [];
            
            options.forEach((opt, idx) => {
                if (opt && explanation.includes(opt.toLowerCase()) && explanation.length > 5) {
                    // Only override if the explanation is very specific about the answer string
                    if (!explanation.includes(options[correctIdx]?.toLowerCase())) {
                        correctIdx = idx;
                    }
                }
            });

            return {
                ...q,
                correctAnswer: Math.min(Math.max(correctIdx, 0), 3)
            };
        });

        res.json(verifiedQuestions.slice(0, 20));
    } catch (err) {
        console.error('APTITUDE GENERATION ERROR:', err.response?.data || err.message);
        
        let errorMessage = err.message;
        if (err.response?.data?.error?.message) {
            errorMessage = err.response.data.error.message;
        } else if (err.response?.data) {
            errorMessage = typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data;
        }

        res.status(500).json({ 
            error: 'Error generating aptitude questions', 
            details: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// @route   POST api/code/save-aptitude-result
// @desc    Save aptitude session results and update user progress
router.post('/save-aptitude-result', auth, async (req, res) => {
    const { results, score, totalQuestions, topicsPerformance } = req.body;

    try {
        const Session = require('../models/Session');
        const UserProgress = require('../models/UserProgress');

        // 1. Create a Session entry
        const session = new Session({
            userId: req.user.id,
            type: 'aptitude',
            questions: results.map(r => r.question),
            answers: results.map(r => r.userAnswer !== null ? r.options[r.userAnswer] : "No Answer"),
            scores: results.map(r => r.isCorrect ? 10 : 0),
            topicLabels: results.map(r => r.topic),
            status: 'completed',
            currentStep: totalQuestions - 1
        });
        await session.save();

        // 2. Update User Progress
        let progress = await UserProgress.findOne({ user: req.user.id });
        if (!progress) {
            progress = new UserProgress({ user: req.user.id });
        }

        // Update weak and strong topics based on performance
        Object.keys(topicsPerformance || {}).forEach(topic => {
            const perf = topicsPerformance[topic];
            if (!perf || perf.total === 0) return;
            
            const accuracy = perf.correct / perf.total;
            
            // Ensure arrays exist
            if (!progress.strongTopics) progress.strongTopics = [];
            if (!progress.weakTopics) progress.weakTopics = [];

            if (accuracy >= 0.8) {
                if (!progress.strongTopics.includes(topic)) progress.strongTopics.push(topic);
                progress.weakTopics = progress.weakTopics.filter(t => t !== topic);
            } else if (accuracy <= 0.4) {
                if (!progress.weakTopics.includes(topic)) progress.weakTopics.push(topic);
                progress.strongTopics = progress.strongTopics.filter(t => t !== topic);
            }
        });

        const scaledScore = totalQuestions > 0 ? (score / totalQuestions) * 10 : 0;
        progress.history.push({
            sessionId: session._id,
            score: scaledScore,
            date: new Date()
        });
        progress.lastAccessed = new Date();
        await progress.save();

        res.json({ msg: 'Aptitude results saved successfully', sessionId: session._id });
    } catch (err) {
        console.error('SAVE APTITUDE ERROR:', err.message);
        res.status(500).json({ error: 'Error saving aptitude results' });
    }
});

module.exports = router;
