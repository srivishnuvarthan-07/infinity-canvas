const Board = require('../../models/Board');
const BoardData = require('../../models/BoardData');

// @desc    Get all boards (in workspace OR all for user)
// @route   GET /api/boards
// @access  Private
exports.getBoards = async (req, res, next) => {
    try {
        let query = { owner: req.user.id };

        const boards = await Board.find(query).sort({ lastModified: -1 });

        res.status(200).json({
            success: true,
            count: boards.length,
            data: boards
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single board metadata
// @route   GET /api/boards/:id
// @access  Private
exports.getBoard = async (req, res, next) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ success: false, error: 'Board not found' });
        }

        res.status(200).json({
            success: true,
            data: board
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new board
// @route   POST /api/boards
// @access  Private
exports.createBoard = async (req, res, next) => {
    try {
        req.body.owner = req.user.id;

        const board = await Board.create(req.body);

        // Initialize empty board data
        try {
            await BoardData.create({
                boardId: board._id,
                data: { shapes: [] }
            });
        } catch (dataErr) {
            console.error("Failed to create BoardData:", dataErr);
            // Cleanup board if data creation fails?
            await Board.findByIdAndDelete(board._id);
            return res.status(500).json({ success: false, error: 'Failed to initialize board data' });
        }

        res.status(201).json({
            success: true,
            data: board
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update board metadata
// @route   PUT /api/boards/:id
// @access  Private
exports.updateBoard = async (req, res, next) => {
    try {
        let board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ success: false, error: 'Board not found' });
        }

        // if (board.owner.toString() !== req.user.id) {
        //     return res.status(401).json({ success: false, error: 'Not authorized to update this board' });
        // }

        board = await Board.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: board
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
exports.deleteBoard = async (req, res, next) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ success: false, error: 'Board not found' });
        }

        if (board.owner.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized to delete this board' });
        }

        // Delete board data first
        await BoardData.deleteOne({ boardId: board._id });

        // Delete board
        await board.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get board data (shapes)
// @route   GET /api/boards/:id/data
// @access  Private
exports.getBoardData = async (req, res, next) => {
    try {
        // First check access via Board metadata
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ success: false, error: 'Board not found' });
        }

        // Basic check: Owner or Public (if implemented)
        // if (board.owner.toString() !== req.user.id && !board.isPublic) {
        //     return res.status(401).json({ success: false, error: 'Not authorized to access this board' });
        // }

        let boardData = await BoardData.findOne({ boardId: req.params.id });

        if (!boardData) {
            // Self-healing: Create default data if missing
            boardData = await BoardData.create({
                boardId: req.params.id,
                data: { shapes: [] }
            });
        }

        res.status(200).json({
            success: true,
            data: boardData
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update board data (shapes)
// @route   PUT /api/boards/:id/data
// @access  Private
exports.updateBoardData = async (req, res, next) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ success: false, error: 'Board not found' });
        }

        // if (board.owner.toString() !== req.user.id) {
        //     return res.status(401).json({ success: false, error: 'Not authorized to update this board' });
        // }

        // Find and update or UPSERT
        const boardData = await BoardData.findOneAndUpdate(
            { boardId: req.params.id },
            {
                data: req.body.data,
                $inc: { version: 1 } // Increment version
            },
            {
                new: true,
                runValidators: true,
                upsert: true // potential fix if created manually
            }
        );

        // Update lastModified on parent Board
        board.lastModified = Date.now();
        await board.save();

        res.status(200).json({
            success: true,
            data: boardData
        });
    } catch (err) {
        next(err);
    }
};
