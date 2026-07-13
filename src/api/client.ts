import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_DOMAIN || 'http://localhost:5000/api/v1/',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_TOKEN || '',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // 🔍 DEBUG: log every outgoing request
        console.log(
            `%c[API →] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
            'color:#6366f1;font-weight:bold'
        );
        if (config.data) {
            console.log('%c[API → BODY]', 'color:#6366f1', JSON.parse(JSON.stringify(config.data)));
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 🔍 DEBUG: log full error response so we can see the real 500 message
        console.error(
            `%c[API ✗] ${error.config?.method?.toUpperCase()} ${error.config?.url} → status=${error.response?.status}`,
            'color:#ef4444;font-weight:bold'
        );
        console.error('[API ✗ RESPONSE BODY]', error.response?.data);
        console.error('[API ✗ REQUEST BODY]', error.config?.data ? JSON.parse(error.config.data) : null);

        // Only redirect on 401 if it's NOT an auth endpoint
        // This allows Login/Register pages to handle their own credential errors
        const isAuthRequest = error.config?.url?.includes('auth/login') || error.config?.url?.includes('auth/register');

        if (error.response?.status === 401 && !isAuthRequest) {
            localStorage.removeItem('token');
            // If already on login, don't reload to avoid losing state
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

