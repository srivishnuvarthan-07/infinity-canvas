import api from '@/lib/api';

const authService = {
    // Register user
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    // Login user
    login: async (userData) => {
        const response = await api.post('/auth/login', userData);
        return response.data;
    },

    // Logout user
    logout: async () => {
        const response = await api.get('/auth/logout');
        return response.data;
    },

    // Get current user
    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    }
};

export default authService;
