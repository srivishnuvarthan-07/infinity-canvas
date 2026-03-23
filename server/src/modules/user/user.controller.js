const User = require('../../models/User');

// @desc    Search users by name or email
// @route   GET /api/users/search?q=query
// @access  Private
exports.searchUsers = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        // Search by name or email (regex partial match, case insensitive)
        const regex = new RegExp(q, 'i');
        const users = await User.find({
            $or: [
                { name: regex },
                { email: regex }
            ]
        }).select('name email _id').limit(20); // Limit to prevent massive payloads

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete user account and all associated data
// @route   DELETE /api/users/me
// @access  Private
exports.deleteMe = async (req, res, next) => {
    try {
        const User = require('../../models/User');
        const Board = require('../../models/Board');
        const BoardData = require('../../models/BoardData');

        // Delete all boards and their data
        const boards = await Board.find({ owner: req.user.id });
        const boardIds = boards.map(b => b._id);
        
        await BoardData.deleteMany({ boardId: { $in: boardIds } });
        await Board.deleteMany({ owner: req.user.id });

        // Delete user
        await User.findByIdAndDelete(req.user.id);

        // Clear cookie
        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        res.status(200).json({
            success: true,
            message: 'Account and all data deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
