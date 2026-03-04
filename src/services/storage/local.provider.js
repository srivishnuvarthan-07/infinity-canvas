import StorageProvider from './storage.provider';

class LocalProvider extends StorageProvider {
    constructor() {
        super();
        this.name = 'local';
        this.BOARDS_KEY = 'infinity_canvas_boards';
        this.DATA_PREFIX = 'infinity_canvas_data_';
    }

    _getBoardsMap() {
        try {
            const json = localStorage.getItem(this.BOARDS_KEY);
            return json ? JSON.parse(json) : {};
        } catch (e) {
            console.error("LocalProvider: Failed to parse boards", e);
            return {};
        }
    }

    _saveBoardsMap(map) {
        localStorage.setItem(this.BOARDS_KEY, JSON.stringify(map));
    }

    async getBoards() {
        const map = this._getBoardsMap();
        return Object.values(map)
            .map(b => ({ ...b, isLocal: true }))
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }


    async createBoard(name) {
        const map = this._getBoardsMap();
        const id = crypto.randomUUID();
        const now = Date.now();

        const newBoard = {
            id,
            name: name || 'Untitled Board',
            updatedAt: now,
            createdAt: now,
            isLocal: true,
            thumbnail: null
        };

        map[id] = newBoard;
        this._saveBoardsMap(map);

        // Initialize empty data
        const initialData = {
            id,
            shapes: [],
            version: 2
        };
        localStorage.setItem(this.DATA_PREFIX + id, JSON.stringify(initialData));

        return newBoard;
    }

    async getBoard(id) {
        const map = this._getBoardsMap();
        const board = map[id];
        if (!board) throw new Error(`Board ${id} not found locally`);
        return { ...board, isLocal: true };
    }


    async updateBoard(id, updates) {
        const map = this._getBoardsMap();
        if (!map[id]) throw new Error(`Board ${id} not found locally`);

        map[id] = { ...map[id], ...updates, updatedAt: Date.now() };
        this._saveBoardsMap(map);
        return map[id];
    }

    async deleteBoard(id) {
        const map = this._getBoardsMap();
        if (map[id]) {
            delete map[id];
            this._saveBoardsMap(map);
        }
        localStorage.removeItem(this.DATA_PREFIX + id);
    }

    async getBoardData(id) {
        const json = localStorage.getItem(this.DATA_PREFIX + id);
        if (!json) {
            // If metadata exists but data doesn't, return empty
            const map = this._getBoardsMap();
            if (map[id]) {
                return { id, shapes: [], version: 2 };
            }
            throw new Error(`Board data ${id} not found locally`);
        }

        const data = JSON.parse(json);
        if (data.version !== 2) {
            throw new Error("Unsupported document version");
        }
        return data;
    }

    async saveBoardData(id, data) {
        // data should be { shapes, version }
        const storedData = {
            id,
            shapes: data.shapes || [],
            version: 2
        };
        localStorage.setItem(this.DATA_PREFIX + id, JSON.stringify(storedData));

        // Update timestamp
        await this.updateBoard(id, {});
    }
}

export default new LocalProvider();
