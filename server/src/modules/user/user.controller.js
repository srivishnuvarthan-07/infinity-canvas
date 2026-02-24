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
