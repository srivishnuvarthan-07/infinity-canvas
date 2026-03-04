import StorageProvider from './storage.provider';
import api from '@/lib/api';

class CloudProvider extends StorageProvider {
    constructor() {
        super();
        this.name = 'cloud';
    }

    async getBoards() {
        try {
            // Get all boards for the user (ignoring workspace hierarchy for now)
            const response = await api.get('/boards');
            return response.data.data.map(b => ({
                id: b._id,
                name: b.name,
                updatedAt: new Date(b.lastModified || b.updatedAt).getTime(),
                createdAt: new Date(b.createdAt).getTime(),
                thumbnail: b.thumbnailUrl,
                isCloud: true,
                isLive: b.isLive || false,
                linkAccess: b.linkAccess,
                visibility: b.visibility,
                owner: b.owner?._id || b.owner,
                ownerDetails: b.owner && typeof b.owner === 'object' ? b.owner : null,
                members: b.members || []
            }));
        } catch (err) {
            console.error("CloudProvider: getBoards failed", err);
            throw err;
        }
    }

    async createBoard(name, options = {}) {
        try {
            // POST to /boards (controller will handle default workspace)
            const payload = { name };
            if (options.workspaceId) payload.workspaceId = options.workspaceId;

            const response = await api.post('/boards', payload);
            const b = response.data.data;
            return {
                id: b._id,
                name: b.name,
                updatedAt: new Date(b.lastModified || b.createdAt).getTime(),
                createdAt: new Date(b.createdAt).getTime(),
                isCloud: true,
                thumbnail: b.thumbnailUrl,
                isLive: b.isLive || false,
                linkAccess: b.linkAccess,
                visibility: b.visibility,
                owner: b.owner?._id || b.owner,
                ownerDetails: b.owner && typeof b.owner === 'object' ? b.owner : null,
                members: b.members || []
            };
        } catch (err) {
            console.error("CloudProvider: createBoard failed", err);
            throw err;
        }
    }

    async getBoard(id) {
        try {
            const response = await api.get(`/boards/${id}`);
            const b = response.data.data;
            return {
                id: b._id,
                name: b.name,
                updatedAt: new Date(b.lastModified || b.updatedAt).getTime(),
                createdAt: new Date(b.createdAt).getTime(),
                isCloud: true,
                thumbnail: b.thumbnailUrl,
                isLive: b.isLive || false,
                linkAccess: b.linkAccess,
                visibility: b.visibility,
                owner: b.owner?._id || b.owner,
                ownerDetails: b.owner && typeof b.owner === 'object' ? b.owner : null,
                members: b.members || []
            };
        } catch (err) {
            console.error("CloudProvider: getBoard failed", err);
            throw err;
        }
    }

    async updateBoard(id, updates) {
        try {
            const payload = { ...updates };
            if (payload.thumbnail !== undefined) {
                payload.thumbnailUrl = payload.thumbnail;
                delete payload.thumbnail;
            }

            const response = await api.put(`/boards/${id}`, payload);
            const b = response.data.data;
            return {
                id: b._id,
                name: b.name,
                updatedAt: new Date(b.lastModified || b.updatedAt).getTime(),
                thumbnail: b.thumbnailUrl,
                isCloud: true,
                isLive: b.isLive || false,
                linkAccess: b.linkAccess,
                visibility: b.visibility,
                owner: b.owner?._id || b.owner,
                ownerDetails: b.owner && typeof b.owner === 'object' ? b.owner : null,
                members: b.members || []
            };
        } catch (err) {
            console.error("CloudProvider: updateBoard failed", err);
            throw err;
        }
    }

    async deleteBoard(id) {
        try {
            await api.delete(`/boards/${id}`);
        } catch (err) {
            console.error("CloudProvider: deleteBoard failed", err);
            throw err;
        }
    }

    async getBoardData(id) {
        try {
            const response = await api.get(`/boards/${id}/data`);
            const data = response.data.data;
            const version = data.data?.version ?? data.version ?? 1;
            if (version !== 2) {
                throw new Error("Unsupported document version");
            }

            return {
                id: id,
                // API returns: { success, data: { _id, board, data: { shapes } } }
                shapes: data.data?.shapes ?? data.shapes ?? [],
                version: 2
            };

        } catch (err) {
            console.error("CloudProvider: getBoardData failed", err);
            throw err;
        }
    }

    async saveBoardData(id, data) {
        try {
            // data is { shapes, version }
            // Backend expects { data: { shapes: ... } }
            await api.put(`/boards/${id}/data`, {
                data: { shapes: data.shapes, version: 2 }
            });
        } catch (err) {
            console.error("CloudProvider: saveBoardData failed", err);
            throw err;
        }
    }

    async addMember(boardId, email, role) {
        try {
            const response = await api.post(`/boards/${boardId}/members`, { email, role });
            return response.data.data; // Array of members
        } catch (err) {
            console.error("CloudProvider: addMember failed", err);
            throw err;
        }
    }

    async removeMember(boardId, userId) {
        try {
            const response = await api.delete(`/boards/${boardId}/members/${userId}`);
            return response.data.data; // Array of members
        } catch (err) {
            console.error("CloudProvider: removeMember failed", err);
            throw err;
        }
    }
}

export default new CloudProvider();
