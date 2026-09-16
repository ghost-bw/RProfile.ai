const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            cookies: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        process.env.JWT_SECRET = 'test_secret';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if no token is provided', () => {
        req.cookies = {};

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msg: 'No token, authorization denied' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token verification fails', () => {
        req.cookies.auth_token = 'invalid-token';
        jwt.verify.mockImplementation(() => {
            throw new Error('jwt expired');
        });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Token is not valid',
            details: 'jwt expired'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next and set req.user if token is valid', () => {
        req.cookies.auth_token = 'valid-token';
        const mockUser = { id: 'user123' };
        jwt.verify.mockReturnValue({ user: mockUser });

        authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test_secret');
        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
    });

    it('should throw error if JWT_SECRET environment variable is missing', () => {
        req.cookies.auth_token = 'valid-token';
        delete process.env.JWT_SECRET;

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            msg: 'Token is not valid'
        }));
    });
});
