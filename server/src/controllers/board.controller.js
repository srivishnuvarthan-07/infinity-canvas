const Board = require('../models/Board');

// @desc    Get all boards
// @route   GET /api/boards
// @access  Private
exports.getBoards = async (req, res, next) => {
    try {
        const boards = await Board.find({
            user: req.user.id,
            deletedAt: null // Only active boards
        });

        res.status(200).json({
            success: true,
            count: boards.length,
            data: boards
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single board
// @route   GET /api/boards/:id
// @access  Private
exports.getBoard = async (req, res, next) => {
    try {
        const board = await Board.findOne({
            _id: req.params.id,
            deletedAt: null // Ensure not deleted
        });

        if (!board) {
            return res.status(404).json({ success: false, error: `Board not found with id of ${req.params.id}` });
        }

        // Make sure user owns the board
        if (board.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to access this board` });
        }

        res.status(200).json({
            success: true,
            data: board
        });
    } catch (err) {
        next(err);
    }
};

// ... (create and update remain mostly same, ensure update checks deletedAt implicitly via getBoard logic if reused or add check)

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
exports.updateBoard = async (req, res, next) => {
    try {
        let board = await Board.findOne({
            _id: req.params.id,
            deletedAt: null
        });

        if (!board) {
            return res.status(404).json({ success: false, error: `Board not found with id of ${req.params.id}` });
        }

        // Make sure user owns the board
        if (board.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to update this board` });
        }

        // Optimistic Concurrency Control
        if (req.body.version && board.version !== req.body.version) {
            return res.status(409).json({
                success: false,
                error: 'Conflict: The board has been modified by another process. Please reload.',
                data: board
            });
        }

        // Increment version
        req.body.version = board.version + 1;

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

// @desc    Delete board (Soft Delete)
// @route   DELETE /api/boards/:id
// @access  Private
exports.deleteBoard = async (req, res, next) => {
    try {
        const board = await Board.findOne({
            _id: req.params.id,
            deletedAt: null
        });

        if (!board) {
            return res.status(404).json({ success: false, error: `Board not found with id of ${req.params.id}` });
        }

        // Make sure user owns the board
        if (board.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to delete this board` });
        }

        // Soft delete
        board.deletedAt = Date.now();
        await board.save();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
