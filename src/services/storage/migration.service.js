import localProvider from './local.provider';
import cloudProvider from './cloud.provider';

class MigrationService {
    // Get count of local boards
    async getLocalBoardCount() {
        const boards = await localProvider.getBoards();
        return boards.length;
    }
    // Migrate a single board from Local to Cloud
    async migrateBoard(localId) {
        try {
            // 1. Get Local Data
            const localBoard = await localProvider.getBoard(localId);
            const localData = await localProvider.getBoardData(localId);

            // 2. Create Cloud Board (keep name)
            const cloudBoard = await cloudProvider.createBoard(localBoard.name);

            // 3. Save Data to Cloud
            await cloudProvider.saveBoardData(cloudBoard.id, {
                shapes: localData.shapes,
                version: 1
            });

            // 4. Delete Local Board
            await localProvider.deleteBoard(localId);

            return cloudBoard;
        } catch (err) {
            console.error(`Migration failed for board ${localId}`, err);
            throw err;
        }
    }
    // Delete all local boards (if user declines migration)
    async clearLocalBoards() {
        const boards = await localProvider.getBoards();
        for (const board of boards) {
            await localProvider.deleteBoard(board.id);
        }
    }
}

export default new MigrationService();
