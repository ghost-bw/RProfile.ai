const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const UserProgress = require('../models/UserProgress');
const Resume = require('../models/Resume');

// @route   GET api/analytics/user
// @desc    Get user performance analytics
router.get('/user', auth, async (req, res) => {
    try {
        const sessions = await Session.find({ userId: req.user.id }).sort({ date: 1 });
        const progress = await UserProgress.findOne({ user: req.user.id });

        if (!sessions || sessions.length === 0) {
            return res.json({
                scoreTrends: [],
                topicPerformance: {},
                weaknessHeatmap: [],
                metrics: {
                    avgAccuracy: 0,
                    avgResponseTime: 0,
                    consistency: 0
                },
                strongTopics: [],
                weakTopics: [],
                aiInsight: "Complete your first interview to see personalized AI insights."
            });
        }

        // Score Trends (Line Chart)
        const scoreTrends = sessions.map(s => ({
            date: s.date,
            avgScore: s.scores && s.scores.length > 0 
                ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length 
                : 0
        }));

        // Topic-wise performance
        const topicPerformance = {};
        sessions.forEach(s => {
            if (s.topicLabels && s.scores) {
                s.topicLabels.forEach((topic, idx) => {
                    if (!topicPerformance[topic]) {
                        topicPerformance[topic] = { totalScore: 0, count: 0 };
                    }
                    topicPerformance[topic].totalScore += s.scores[idx] || 0;
                    topicPerformance[topic].count += 1;
                });
            }
        });

        Object.keys(topicPerformance).forEach(topic => {
            topicPerformance[topic] = topicPerformance[topic].totalScore / topicPerformance[topic].count;
        });

        // Weakness Heatmap (Topics with low scores)
        const weaknessHeatmap = Object.keys(topicPerformance)
            .filter(topic => topicPerformance[topic] < 6)
            .map(topic => ({ topic, score: topicPerformance[topic] }));

        // Metrics
        const allScores = sessions.flatMap(s => s.scores || []);
        const avgAccuracy = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
        
        const allResponseTimes = sessions.flatMap(s => s.responseTimes || []);
        const avgResponseTime = allResponseTimes.length > 0 ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length : 0;

        // Generate dynamic AI Insight
        const lastSession = sessions[sessions.length - 1];
        const latestAvg = (lastSession.scores && lastSession.scores.length > 0)
            ? lastSession.scores.reduce((a, b) => a + b, 0) / lastSession.scores.length
            : 0;
        
        let insight = "Keep practicing to see personalized AI insights.";
        if (latestAvg >= 8) {
            insight = `Excellent performance in your last session! Focus on maintaining this depth while increasing response speed.`;
        } else if (latestAvg >= 5) {
            insight = `Good progress. Review the suggestions from your last session to bridge small technical gaps.`;
        } else if (sessions.length > 0) {
            insight = `You struggled with some topics recently. Consider following the study roadmap to strengthen these fundamentals before your next try.`;
        }

        res.json({
            scoreTrends,
            topicPerformance,
            weaknessHeatmap,
            metrics: {
                avgAccuracy: avgAccuracy.toFixed(2),
                avgResponseTime: avgResponseTime.toFixed(2),
                consistency: (avgAccuracy * 10).toFixed(0)
            },
            strongTopics: progress ? progress.strongTopics : [],
            weakTopics: progress ? progress.weakTopics : [],
            aiInsight: insight
        });
    } catch (err) {
        console.error('ANALYTICS ERROR:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/analytics/coding-stats
// @desc    Get user's coding submission stats
router.get('/coding-stats', auth, async (req, res) => {
    try {
        const progress = await UserProgress.findOne({ user: req.user.id });
        
        if (!progress || !progress.solvedProblems) {
            return res.json({
                totalSolved: 0,
                easy: 0,
                medium: 0,
                hard: 0,
                recentSolved: []
            });
        }

        const stats = {
            totalSolved: progress.solvedProblems.length,
            easy: progress.solvedProblems.filter(p => p.difficulty === 'Easy').length,
            medium: progress.solvedProblems.filter(p => p.difficulty === 'Medium').length,
            hard: progress.solvedProblems.filter(p => p.difficulty === 'Hard').length,
            recentSolved: progress.solvedProblems.slice(-5).reverse()
        };

        res.json(stats);
    } catch (err) {
        console.error('CODING STATS ERROR:', err.message);
        res.status(500).json({ error: 'Failed to fetch coding stats' });
    }
});

// @route   GET api/analytics/roadmap
// @desc    Generate AI study roadmap based on resume and performance from all rounds
router.get('/roadmap', auth, async (req, res) => {
    try {
        // 1. Check for Resume
        const resume = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        if (!resume) {
            return res.status(400).json({ 
                error: 'Prerequisites Not Met', 
                msg: 'Please upload your resume first. We need to understand your background to generate a relevant roadmap.' 
            });
        }

        // 2. Fetch Performance Data
        const progress = await UserProgress.findOne({ user: req.user.id });
        const sessions = await Session.find({ userId: req.user.id, status: 'completed' });
        
        // 3. Check for at least one completed round (Session or Coding Problem)
        const hasCompletedSession = sessions.length > 0;
        const hasSolvedCoding = progress && progress.solvedProblems && progress.solvedProblems.length > 0;

        if (!hasCompletedSession && !hasSolvedCoding) {
            return res.status(400).json({
                error: 'Prerequisites Not Met',
                msg: 'Please complete at least one round (Interview, Aptitude, or Coding) so we can analyze your current skill level.'
            });
        }

        const interviewSessions = sessions.filter(s => s.type === 'interview');
        const aptitudeSessions = sessions.filter(s => s.type === 'aptitude');

        // Extract some context from sessions
        const interviewFeedback = interviewSessions.map(s => s.evaluations ? s.evaluations.join(' ') : '').join(' ').substring(0, 1000);
        const aptitudePerformance = aptitudeSessions.map(s => {
            const avg = s.scores && s.scores.length > 0 ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : 0;
            return `Aptitude on ${s.date.toLocaleDateString()}: Avg Score ${avg}/10`;
        }).join('\n');

        const solvedCoding = progress ? progress.solvedProblems.map(p => `${p.title} (${p.difficulty})`).join(', ') : 'None';

        const prompt = `
            STRICT GUIDELINE: 
            Do NOT default to Software Engineering or SDE roles unless the resume explicitly indicates it. 
            Analyze the user's resume carefully to determine their actual field (e.g., HR, Marketing, Finance, Nursing, Mechanical Engineering, etc.) and generate a roadmap SPECIFIC to that field.

            USER BACKGROUND (from Resume):
            ${(resume.originalText || '').substring(0, 3000)}

            PERFORMANCE DATA:
            - Weak Topics identified in sessions: ${progress && progress.weakTopics && progress.weakTopics.length > 0 ? progress.weakTopics.join(', ') : 'None yet'}
            - Strong Topics identified in sessions: ${progress && progress.strongTopics && progress.strongTopics.length > 0 ? progress.strongTopics.join(', ') : 'Basic fundamentals'}
            - Recent Interview Feedback Summary: ${interviewFeedback || 'No interview feedback available yet'}
            - Recent Aptitude Rounds: ${aptitudePerformance || 'No aptitude sessions completed yet'}
            - Coding Problems Solved (if any): ${solvedCoding}

            TASK:
            1. Identify the user's field from their resume.
            2. Generate a highly personalized 7-day career improvement roadmap for that SPECIFIC field.
            3. If the user is in a non-tech field, the "Practical Action" should involve field-specific tasks (e.g., "Analyze a case study", "Draft a press release", "Practice clinical scenarios").
            4. Integrate the performance data: If they failed an aptitude round, include logic/quant training. If their interview feedback mentioned "communication," focus Day 1 on soft skills.
            
            STRUCTURE:
            - "Roadmap": A detailed 7-day plan in Markdown format.
            
            FORMATTING FOR ROADMAP:
            - # [Title: 7-Day Roadmap for {User's Specific Role}]
            - ## DAY 1: [Specific Topic Name]
            - **Concepts**: ...
            - **Action Items**: ...
            - **Self-Check**: ...

            RETURN JSON:
            { "roadmap": "markdown string here" }
        `;

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a world-class career growth strategist and mentor. You specialize in creating actionable, realistic, and highly personalized improvement plans based on data. You must return your response in JSON format.'
                    },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: "json_object" },
                max_tokens: 4000,
                temperature: 0.7
            },
            {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
            }
        );

        const result = JSON.parse(response.data.choices[0].message.content);
        res.json(result);
    } catch (err) {
        console.error('ROADMAP ERROR:', err.response?.data || err.message);
        res.status(500).json({ 
            error: 'Failed to generate roadmap', 
            details: err.response?.data?.error?.message || err.message 
        });
    }
});

module.exports = router;
