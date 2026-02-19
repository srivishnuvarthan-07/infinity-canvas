import api from '@/lib/api';

const workspaceService = {
    // Get all workspaces for current user
    getWorkspaces: async () => {
        const response = await api.get('/workspaces');
        return response.data;
    },

    // Create a new workspace
    createWorkspace: async (data) => {
        const response = await api.post('/workspaces', data);
        return response.data;
    },

    // Update a workspace
    updateWorkspace: async (id, data) => {
        const response = await api.put(`/workspaces/${id}`, data);
        return response.data;
    },

    // Delete a workspace
    deleteWorkspace: async (id) => {
        const response = await api.delete(`/workspaces/${id}`);
        return response.data;
    }
};

export default workspaceService;
