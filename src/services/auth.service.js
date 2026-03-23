import api from '@/lib/api';

const authService = {
    // Register user
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (response.data.token) {
            // Token is handled via HttpOnly cookie by backend, but we might receive it in response too
            // If backend sends token in JSON, we can store it (optional, if we use headers)
            // But our backend sends cookie.
        }
        return response.data;
    },

    // Login user
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    // Logout user
    logout: async () => {
        const response = await api.get('/auth/logout');
        return response.data;
    },

    // Get current user — returns null if not logged in (401 is expected in guest mode)
    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (err) {
            if (err.response?.status === 401) {
                return null; // Guest mode — not an error
            }
            throw err; // Real error (5xx, network, etc.)
        }
    },

    // Update Profile
    updateProfile: async (updates) => {
        const response = await api.put('/profile/update', updates);
        return response.data;
    }
};

export default authService;
