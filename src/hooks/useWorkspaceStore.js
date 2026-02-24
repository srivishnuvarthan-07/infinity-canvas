import { create } from 'zustand';
import api from '@/services/axios';

export const useWorkspaceStore = create((set, get) => ({
    workspaces: [],
    activeWorkspaceId: null,
    status: 'idle', // 'idle' | 'loading' | 'ok' | 'error'
    error: null,

    fetchWorkspaces: async () => {
        set({ status: 'loading' });
        try {
            const res = await api.get('/workspaces');
            const workspaces = res.data.data;
            set({
                workspaces,
                status: 'ok',
                error: null,
                // Default to Personal workspace if exists, otherwise first one.
                activeWorkspaceId: get().activeWorkspaceId || (workspaces.length > 0 ? workspaces[0]._id : null)
            });
        } catch (err) {
            console.error('Failed to fetch workspaces:', err);
            set({ status: 'error', error: err.response?.data?.error || err.message, workspaces: [] });
        }
    },

    setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),

    createWorkspace: async (name) => {
        try {
            const res = await api.post('/workspaces', { name });
            const newWorkspace = res.data.data;
            set(state => ({
                workspaces: [...state.workspaces, newWorkspace],
                activeWorkspaceId: newWorkspace._id
            }));
            return newWorkspace;
        } catch (err) {
            console.error('createWorkspace failed', err);
            throw err;
        }
    },

    deleteWorkspace: async (id) => {
        try {
            await api.delete(`/workspaces/${id}`);
            const remaining = get().workspaces.filter(w => w._id !== id);
            set({
                workspaces: remaining,
                activeWorkspaceId: get().activeWorkspaceId === id ? (remaining.length > 0 ? remaining[0]._id : null) : get().activeWorkspaceId
            });
        } catch (err) {
            console.error('deleteWorkspace failed', err);
            throw err;
        }
    },

    updateWorkspace: async (id, data) => {
        try {
            const res = await api.put(`/workspaces/${id}`, data);
            set(state => ({
                workspaces: state.workspaces.map(w => w._id === id ? res.data.data : w)
            }));
        } catch (err) {
            console.error('updateWorkspace failed', err);
            throw err;
        }
    },

    addMember: async (workspaceId, userId, role = 'viewer') => {
        try {
            const res = await api.post(`/workspaces/${workspaceId}/members`, { userId, role });
            set(state => ({
                workspaces: state.workspaces.map(w => w._id === workspaceId ? res.data.data : w)
            }));
        } catch (err) {
            throw err;
        }
    },

    removeMember: async (workspaceId, userId) => {
        try {
            const res = await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
            set(state => ({
                workspaces: state.workspaces.map(w => w._id === workspaceId ? res.data.data : w)
            }));
        } catch (err) {
            throw err;
        }
    }

}));
