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
                thumbnail: b.thumbnail,
                isCloud: true
            }));
        } catch (err) {
            console.error("CloudProvider: getBoards failed", err);
            throw err;
        }
    }

    async createBoard(name) {
        try {
            // POST to /boards (controller will handle default workspace)
            const response = await api.post('/boards', { name });
            const b = response.data.data;
            return {
                id: b._id,
                name: b.name,
                updatedAt: new Date(b.lastModified || b.createdAt).getTime(),
                createdAt: new Date(b.createdAt).getTime(),
                isCloud: true
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
                isCloud: true
            };
        } catch (err) {
            console.error("CloudProvider: getBoard failed", err);
            throw err;
        }
    }

    async updateBoard(id, updates) {
        try {
            const response = await api.put(`/boards/${id}`, updates);
            const b = response.data.data;
            return {
                id: b._id,
                name: b.name,
                updatedAt: new Date(b.lastModified || b.updatedAt).getTime(),
                isCloud: true
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
            return {
                id: id,
                // API returns: { success, data: { _id, board, data: { shapes } } }
                shapes: data.data?.shapes ?? data.shapes ?? [],
                version: data.version ?? 1
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
                data: { shapes: data.shapes }
            });
        } catch (err) {
            console.error("CloudProvider: saveBoardData failed", err);
            throw err;
        }
    }
}

export default new CloudProvider();
