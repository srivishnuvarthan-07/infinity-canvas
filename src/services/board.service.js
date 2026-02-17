import api from '@/lib/api';

const boardService = {
    // Get all boards
    getBoards: async () => {
        const response = await api.get('/boards');
        return response.data;
    },

    // Get single board
    getBoard: async (id) => {
        const response = await api.get(`/boards/${id}`);
        return response.data;
    },

    // Create board
    createBoard: async (boardData) => {
        const response = await api.post('/boards', boardData);
        return response.data;
    },

    // Update board
    updateBoard: async (id, boardData) => {
        const response = await api.put(`/boards/${id}`, boardData);
        return response.data;
    },

    // Delete board
    deleteBoard: async (id) => {
        const response = await api.delete(`/boards/${id}`);
        return response.data;
    },
};

export default boardService;
