const { getAllowedOrigins, isAllowedOrigin } = require('../utils/cors');

describe('CORS origin policy', () => {
    it('allows only configured frontend origins in production', () => {
        const allowedOrigins = getAllowedOrigins({
            NODE_ENV: 'production',
            FRONTEND_URL: 'https://app.example.com,https://preview.example.com'
        });

        expect(isAllowedOrigin('https://app.example.com', allowedOrigins)).toBe(true);
        expect(isAllowedOrigin('https://untrusted.onrender.com', allowedOrigins)).toBe(false);
        expect(isAllowedOrigin('http://localhost:5173', allowedOrigins)).toBe(false);
    });

    it('allows local development origins outside production', () => {
        const allowedOrigins = getAllowedOrigins({
            NODE_ENV: 'development',
            FRONTEND_URL: 'https://app.example.com'
        });

        expect(isAllowedOrigin('http://localhost:5173', allowedOrigins)).toBe(true);
        expect(isAllowedOrigin('http://127.0.0.1:3000', allowedOrigins)).toBe(true);
    });

    it('rejects malformed or non-HTTP frontend origins', () => {
        expect(() => getAllowedOrigins({
            NODE_ENV: 'production',
            FRONTEND_URL: 'not-an-origin'
        })).toThrow('Invalid frontend origin in FRONTEND_URL');
        expect(() => getAllowedOrigins({
            NODE_ENV: 'production',
            FRONTEND_URL: 'file:///tmp/frontend'
        })).toThrow('Frontend origin must use HTTP or HTTPS');
    });
});
