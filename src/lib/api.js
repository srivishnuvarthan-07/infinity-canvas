import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api', // Use proxy
    withCredentials: true, // Important for HttpOnly cookies
    headers: {
        'Content-Type': 'application/json'
    }
});

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Check for 401 Unauthorized (Token expired/invalid)
        if (error.response && error.response.status === 401) {
            // Allow the error to propagate so useAuth can handle it (e.g., logout)
            // We could add auto-refresh token logic here later
            console.warn('Unauthorized access. Session may have expired.');
        }
        return Promise.reject(error);
    }
);

export default api;
