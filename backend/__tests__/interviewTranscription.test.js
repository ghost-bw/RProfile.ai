const express = require('express');
const request = require('supertest');
const FormData = require('form-data');

jest.mock('axios', () => ({
    post: jest.fn()
}));
jest.mock('../middleware/auth', () => (req, res, next) => {
    req.user = { id: 'user-123' };
    next();
});
jest.mock('../utils/embeddings', () => ({
    generateEmbedding: jest.fn()
}));
jest.mock('../utils/pinecone', () => ({
    queryResumeChunks: jest.fn()
}));

const axios = require('axios');
const interviewRoutes = require('../routes/interview');

describe('POST /interview/transcribe', () => {
    const originalGroqKey = process.env.GROQ_API_KEY;
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/interview', interviewRoutes);
        process.env.GROQ_API_KEY = 'test-groq-key';
        jest.clearAllMocks();
    });

    afterAll(() => {
        if (originalGroqKey === undefined) {
            delete process.env.GROQ_API_KEY;
        } else {
            process.env.GROQ_API_KEY = originalGroqKey;
        }
    });

    it('transcribes an uploaded audio recording with Groq Whisper Turbo', async () => {
        axios.post.mockResolvedValue({ data: { text: 'My interview answer.' } });

        const response = await request(app)
            .post('/api/interview/transcribe')
            .attach('audio', Buffer.from('fake-webm-audio'), {
                filename: 'answer.webm',
                contentType: 'audio/webm'
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ text: 'My interview answer.' });
        expect(axios.post).toHaveBeenCalledWith(
            'https://api.groq.com/openai/v1/audio/transcriptions',
            expect.any(FormData),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-groq-key'
                }),
                timeout: 120000
            })
        );

        const [url, form] = axios.post.mock.calls[0];
        expect(url).toContain('/audio/transcriptions');
        const multipartBody = form.getBuffer().toString();
        expect(multipartBody).toContain('whisper-large-v3-turbo');
        expect(multipartBody).toContain('interview-answer.webm');
        expect(multipartBody).toContain('fake-webm-audio');
    });

    it('rejects requests without an audio recording', async () => {
        const response = await request(app).post('/api/interview/transcribe');

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Record an audio answer');
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('requires the server-side Groq API key', async () => {
        delete process.env.GROQ_API_KEY;

        const response = await request(app)
            .post('/api/interview/transcribe')
            .attach('audio', Buffer.from('fake-webm-audio'), {
                filename: 'answer.webm',
                contentType: 'audio/webm'
            });

        expect(response.status).toBe(503);
        expect(response.body.error).toContain('not configured');
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('rejects unsupported audio formats', async () => {
        const response = await request(app)
            .post('/api/interview/transcribe')
            .attach('audio', Buffer.from('fake-audio'), {
                filename: 'answer.aac',
                contentType: 'audio/aac'
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Unsupported audio format');
        expect(axios.post).not.toHaveBeenCalled();
    });
});
