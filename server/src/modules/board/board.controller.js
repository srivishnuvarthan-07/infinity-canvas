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
        const board = await Board.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('members.userId', 'name email');

        if (!board) {
            return res.status(404).json({ success: false, error: 'Board not found' });
        }

        const canView = await board.hasAccess(req.user, 'view');
        if (!canView) {
            return res.status(401).json({ success: false, error: 'Not authorized to access this board' });
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

        const canEdit = await board.hasAccess(req.user, 'edit');
        if (!canEdit) {
            return res.status(401).json({ success: false, error: 'Not authorized to update this board' });
        }

        // Check if isLive is being toggled ON
        const wasLive = board.isLive;
        const isNowLive = req.body.isLive === true;

        // Protect owner field
        delete req.body.owner;
        delete req.body.members; // Use separate member endpoints

        board = await Board.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Trigger Live Session Notification
        if (!wasLive && isNowLive) {
            const Notification = require('../../models/Notification');
            const { emitNotification } = require('../../socket.handler');

            board.members.forEach(async (member) => {
                const memberId = member.userId._id ? member.userId._id.toString() : member.userId.toString();
                if (memberId !== req.user.id) {
                    try {
                        const notif = await Notification.create({
                            recipient: memberId,
                            sender: req.user.id,
                            type: 'session_join',
                            message: `${req.user.name} started a live session on "${board.name}"`,
                            boardId: board._id
                        });
                        const popNotif = await Notification.findById(notif._id)
                            .populate('sender', 'name email')
                            .populate('boardId', 'name');
                        emitNotification(memberId, popNotif);
                    } catch (err) {
                        console.error("Failed to send session_join notification", err);
                    }
                }
            });
        }

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

        // Only explicitly owners can delete a board
        if (!req.user || board.owner.toString() !== req.user.id) {
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
        const canView = await board.hasAccess(req.user, 'view');
        if (!canView) {
            return res.status(401).json({ success: false, error: 'Not authorized to access this board' });
        }

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

        const canEdit = await board.hasAccess(req.user, 'edit');
        if (!canEdit) {
            return res.status(401).json({ success: false, error: 'Not authorized to update this board data' });
        }

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

// @desc    Add member to board
// @route   POST /api/boards/:id/members
// @access  Private (Owner only)
exports.addBoardMember = async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ success: false, error: 'Board not found' });
        }

        // Only owner can add members
        if (board.owner.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized to add members to this board' });
        }

        const User = require('../../models/User');
        const userToAdd = await User.findOne({ email });

        if (!userToAdd) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const userIdToAdd = userToAdd._id.toString();

        // Check if already owner
        if (board.owner.toString() === userIdToAdd) {
            return res.status(400).json({ success: false, error: 'User is the owner of this board' });
        }

        // Check if already a member
        const isMember = board.members.some(m => m.userId.toString() === userIdToAdd);
        if (isMember) {
            return res.status(400).json({ success: false, error: 'User is already a member' });
        }

        board.members.push({ userId: userToAdd._id, role: role || 'viewer' });
        await board.save();

        const updatedBoard = await Board.findById(board._id)
            .populate('owner', 'name email')
            .populate('members.userId', 'name email');

        // Create and emit notification to the invited user
        try {
            const Notification = require('../../models/Notification');
            const { emitNotification } = require('../../socket.handler');
            const notif = await Notification.create({
                recipient: userToAdd._id,
                sender: req.user.id,
                type: 'invite',
                message: `${req.user.name} invited you to the board "${board.name}"`,
                boardId: board._id
            });
            const popNotif = await Notification.findById(notif._id)
                .populate('sender', 'name email')
                .populate('boardId', 'name');
            emitNotification(userToAdd._id, popNotif);
        } catch (err) {
            console.error("Failed to send invite notification", err);
        }

        res.status(200).json({
            success: true,
            data: updatedBoard.members
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove member from board
// @route   DELETE /api/boards/:id/members/:userId
// @access  Private (Owner only)
exports.removeBoardMember = async (req, res, next) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ success: false, error: 'Board not found' });
        }

        // Only owner can remove members
        if (board.owner.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized to remove members from this board' });
        }

        board.members = board.members.filter(m => m.userId.toString() !== req.params.userId);
        await board.save();

        res.status(200).json({
            success: true,
            data: board.members
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete all boards for a user
// @route   DELETE /api/boards
// @access  Private
exports.deleteAllBoards = async (req, res, next) => {
    try {
        const boards = await Board.find({ owner: req.user.id });
        const boardIds = boards.map(b => b._id);

        // Delete all associated board data
        await BoardData.deleteMany({ boardId: { $in: boardIds } });

        // Delete all boards
        await Board.deleteMany({ owner: req.user.id });

        res.status(200).json({
            success: true,
            message: 'All boards deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Export all user boards data
// @route   GET /api/boards/export
// @access  Private
exports.exportBoards = async (req, res, next) => {
    try {
        const boards = await Board.find({ owner: req.user.id });
        const exportData = [];

        for (const board of boards) {
            const boardData = await BoardData.findOne({ boardId: board._id });
            exportData.push({
                metadata: board,
                data: boardData ? boardData.data : { shapes: [] }
            });
        }

        res.status(200).json({
            success: true,
            data: exportData
        });
    } catch (err) {
        next(err);
    }
};
