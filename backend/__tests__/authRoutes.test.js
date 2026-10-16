const express = require('express');
const request = require('supertest');

jest.mock('bcryptjs', () => ({
    compare: jest.fn()
}));
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn()
}));
jest.mock('../models/User', () => ({
    findOne: jest.fn()
}));
jest.mock('../middleware/auth', () => jest.fn((req, res, next) => next()));
jest.mock('../utils/mailer', () => ({
    sendOTP: jest.fn()
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authRoutes = require('../routes/auth');

describe('POST /login', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/auth', authRoutes);
        process.env.JWT_SECRET = 'test-secret';
        jest.clearAllMocks();
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('test-token');
    });

    it('rejects a correct password for an unverified account without issuing a token', async () => {
        User.findOne.mockResolvedValue({
            id: 'user-123',
            password: 'hashed-password',
            isVerified: false
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'unverified@example.com', password: 'password' });

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ msg: 'Please verify your email before logging in.' });
        expect(jwt.sign).not.toHaveBeenCalled();
        expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('continues to authenticate verified accounts', async () => {
        User.findOne.mockResolvedValue({
            id: 'user-123',
            password: 'hashed-password',
            isVerified: true
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'verified@example.com', password: 'password' });

        expect(response.status).toBe(200);
        expect(jwt.sign).toHaveBeenCalled();
        expect(response.headers['set-cookie']).toEqual(
            expect.arrayContaining([expect.stringContaining('auth_token=test-token')])
        );
    });
});
