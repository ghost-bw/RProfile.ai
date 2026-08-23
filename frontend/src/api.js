import axios from 'axios';

let rawBaseUrl = import.meta.env.VITE_API_URI || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Normalize URL: remove trailing slashes
rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');

// Ensure /api path prefix is included
if (!rawBaseUrl.endsWith('/api')) {
    rawBaseUrl = `${rawBaseUrl}/api`;
}

const api = axios.create({
    baseURL: rawBaseUrl,
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
