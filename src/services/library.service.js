import api from '@/lib/api';

const libraryService = {
    // Get library items
    getLibraryItems: async () => {
        const response = await api.get('/library');
        return response.data;
    },
    
    // Get public library items
    getPublicLibraryItems: async () => {
        const response = await api.get('/library/public');
        return response.data;
    },

    // Create library item
    createLibraryItem: async (itemData) => {
        const response = await api.post('/library', itemData);
        return response.data;
    },

    // Delete library item
    deleteLibraryItem: async (id) => {
        const response = await api.delete(`/library/${id}`);
        return response.data;
    },

    // Update library item
    updateLibraryItem: async (id, data) => {
        const response = await api.patch(`/library/${id}`, data);
        return response.data;
    }
};

export default libraryService;
