const LibraryItem = require('../models/LibraryItem');

// @desc    Get user's library items (and public ones)
// @route   GET /api/library
// @access  Private
exports.getLibraryItems = async (req, res, next) => {
    try {
        const items = await LibraryItem.find({
            $or: [
                { user: req.user.id },
                { isPublic: true }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create library item
// @route   POST /api/library
// @access  Private
exports.createLibraryItem = async (req, res, next) => {
    try {
        req.body.user = req.user.id;

        const item = await LibraryItem.create(req.body);

        res.status(201).json({
            success: true,
            data: item
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete library item
// @route   DELETE /api/library/:id
// @access  Private
exports.deleteLibraryItem = async (req, res, next) => {
    try {
        const item = await LibraryItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ success: false, error: `Library item not found with id of ${req.params.id}` });
        }

        // Make sure user owns the item
        if (item.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to delete this item` });
        }

        await item.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
