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
        return Promise.reject(error);
    }
);

export default api;
