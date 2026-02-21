/**
 * @typedef {Object} BoardMeta
 * @property {string} id - Unique identifier
 * @property {string} name - Board name
 * @property {number} updatedAt - Timestamp
 * @property {string} [thumbnail] - Base64 thumbnail (optional)
 */

/**
 * @typedef {Object} BoardData
 * @property {string} id - Board ID
 * @property {Array} shapes - List of shapes
 * @property {number} version - Version info
 */

/**
 * Interface/Base Class for Storage Providers
 */
class StorageProvider {
    /**
     * Get all boards
     * @returns {Promise<BoardMeta[]>}
     */
    async getBoards() { throw new Error("Not implemented"); }

    /**
     * Create a new board
     * @param {string} name 
     * @returns {Promise<BoardMeta>}
     */
    async createBoard(name) { throw new Error("Not implemented"); }

    /**
     * Get board metadata
     * @param {string} id 
     * @returns {Promise<BoardMeta>}
     */
    async getBoard(id) { throw new Error("Not implemented"); }

    /**
     * Update board metadata
     * @param {string} id 
     * @param {Object} updates 
     * @returns {Promise<BoardMeta>}
     */
    async updateBoard(id, updates) { throw new Error("Not implemented"); }

    /**
     * Delete board
     * @param {string} id 
     * @returns {Promise<void>}
     */
    async deleteBoard(id) { throw new Error("Not implemented"); }

    /**
     * Get board data (shapes)
     * @param {string} id 
     * @returns {Promise<BoardData>}
     */
    async getBoardData(id) { throw new Error("Not implemented"); }

    /**
     * Save board data
     * @param {string} id 
     * @param {Object} data - { shapes, version }
     * @returns {Promise<void>}
     */
    async saveBoardData(id, data) { throw new Error("Not implemented"); }
}

export default StorageProvider;
