import api from '@/lib/api';

const boardDataService = {
    // Get board data (shapes)
    getBoardData: async (boardId) => {
        const response = await api.get(`/boards/${boardId}/data`);
        return response.data;
    },

    // Update board data (shapes)
    saveBoardData: async (boardId, data) => {
        const response = await api.put(`/boards/${boardId}/data`, { data });
        return response.data;
    }
};

export default boardDataService;
