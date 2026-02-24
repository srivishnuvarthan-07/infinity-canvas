import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api', // Use proxy or env var
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
            console.warn('Unauthorized access. Session may have expired.');
            // Note: useAuth or specific components can handle redirect to login
        }
        return Promise.reject(error);
    }
);

export default api;
