const LOCAL_DEVELOPMENT_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
];

const normalizeOrigins = (value = '') => value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
    .map(origin => {
        let parsedOrigin;
        try {
            parsedOrigin = new URL(origin);
        } catch {
            throw new Error(`Invalid frontend origin in FRONTEND_URL: ${origin}`);
        }

        if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
            throw new Error(`Frontend origin must use HTTP or HTTPS: ${origin}`);
        }

        return parsedOrigin.origin;
    });

const getAllowedOrigins = (env = process.env) => [
    ...normalizeOrigins(env.FRONTEND_URL),
    ...(env.NODE_ENV === 'production' ? [] : LOCAL_DEVELOPMENT_ORIGINS)
];

const isAllowedOrigin = (origin, allowedOrigins) =>
    !origin || allowedOrigins.includes(origin);

module.exports = { getAllowedOrigins, isAllowedOrigin };
