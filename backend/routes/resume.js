const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const axios = require('axios');
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const { generateEmbedding, chunkText } = require('../utils/embeddings');
const { upsertResumeChunks, queryResumeChunks } = require('../utils/pinecone');


// Multer setup
const upload = multer({ dest: 'uploads/' });

// @route   POST api/resume/upload
// @desc    Upload and parse resume
router.post('/upload', [auth, upload.single('resume')], async (req, res) => {
    try {
        console.log('--- RESUME UPLOAD START ---');
        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ msg: 'Please upload a PDF file' });
        }
        console.log('File received:', req.file.originalname, 'Size:', req.file.size);

        if (!process.env.GROQ_API_KEY) {
            console.error('CRITICAL: GROQ_API_KEY is not set in .env');
            return res.status(500).json({ error: 'Server configuration error: missing API key' });
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        console.log('Parsing PDF...');
        const data = await pdf(dataBuffer);
        const text = data.text;
        console.log('PDF parsed successfully. Text length:', text.length);

        const modelName = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
        console.log(`Sending request to Groq (${modelName}) for ATS analysis...`);
        const atsResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: modelName,
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are an expert ATS (Applicant Tracking System) analyzer. Analyze the resume text and provide: 1. ATS Score (0-100) and 2. 3-5 short improvement tips. Return the response in JSON format: { "score": number, "tips": [string] }' 
                    },
                    { role: 'user', content: `Resume Text: ${text.substring(0, 4000)}` }
                ],
                response_format: { type: "json_object" }
            },
            {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
            }
        );

        let atsAnalysis;
        try {
            atsAnalysis = JSON.parse(atsResponse.data.choices[0].message.content);
            console.log('ATS Analysis complete:', atsAnalysis.score);
        } catch (parseErr) {
            console.error('Error parsing Groq JSON response:', parseErr.message);
            atsAnalysis = { score: 70, tips: [] };
        }

        // Chunk and Embed
        console.log('Generating embeddings...');
        const chunks = chunkText(text);
        const embeddedChunks = [];

        for (const chunk of chunks) {
            const embedding = await generateEmbedding(chunk);
            embeddedChunks.push({ text: chunk, embedding });
        }
        console.log('Embeddings generated for', embeddedChunks.length, 'chunks');

        // Save to DB (without vectors to keep MongoDB document size small)
        const newResume = new Resume({
            userId: req.user.id,
            originalText: text,
            chunks: embeddedChunks.map(c => ({ text: c.text })),
            atsScore: atsAnalysis.score || 70,
            improvementTips: atsAnalysis.tips || []
        });

        await newResume.save();
        console.log('Resume saved to database. ID:', newResume._id);

        // Save vectors to Pinecone
        console.log('Saving vectors to Pinecone...');
        await upsertResumeChunks(newResume._id, req.user.id, embeddedChunks);
        console.log('Pinecone sync completed.');

        // Remove the temporary file
        fs.unlinkSync(req.file.path);

        console.log('--- RESUME UPLOAD SUCCESS ---');
        res.json(newResume);
    } catch (err) {
        console.error('RESUME UPLOAD ERROR:', err.message);
        if (err.response) {
            console.error('Error Response Data:', err.response.data);
            console.error('Error Response Status:', err.response.status);
        }
        res.status(500).json({ error: 'Server error during parsing and embedding', details: err.message });
    }
});

// @route   GET api/resume/latest
// @desc    Get latest resume for user
router.get('/latest', auth, async (req, res) => {
    try {
        const resume = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        if (!resume) return res.status(404).json({ msg: 'No resume found' });
        res.json(resume);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/resume/analyze-jd
// @desc    Compare resume with job description
router.post('/analyze-jd', auth, async (req, res) => {
    const { jd } = req.body;
    try {
        const resume = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        if (!resume) return res.status(404).json({ msg: 'No resume found' });

        let relevantContext = "";
        try {
            const jdEmbedding = await generateEmbedding(jd);
            const matches = await queryResumeChunks(jdEmbedding, 5, { userId: req.user.id });
            relevantContext = matches.map(m => m.metadata.text).join('\n---\n');
        } catch (pinErr) {
            console.error('Pinecone retrieval error, falling back to basic substring:', pinErr.message);
            relevantContext = (resume.originalText || '').substring(0, 4000);
        }
        if (!relevantContext) {
            relevantContext = (resume.originalText || '').substring(0, 4000);
        }

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
                messages: [
                    { 
                        role: 'system', 
                        content: `You are a strict, senior technical recruiter and ATS specialist. 
                        Your goal is to provide a BRUTALLY HONEST match percentage. 
                        Do NOT give a score above 80 unless the candidate is an near-perfect fit. 
                        Be very critical of missing skills, seniority levels, and domain experience.
                        Return JSON: { "score": number (0-100), "missingSkills": [string], "improvementTips": [string], "rationale": string }` 
                    },
                    { role: 'user', content: `Relevant Resume Content:\n${relevantContext}\n\nJob Description: ${jd}` }
                ],
                response_format: { type: "json_object" }
            },
            {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
            }
        );

        const analysis = JSON.parse(response.data.choices[0].message.content);
        res.json(analysis);
    } catch (err) {
        console.error('JD ANALYSIS ERROR:', err.message);
        res.status(500).json({ error: 'Error analyzing job description' });
    }
});

module.exports = router;
