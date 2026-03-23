const LibraryItem = require('../../models/LibraryItem');

// @desc    Get all library items for user
// @route   GET /api/library
// @access  Private
exports.getLibraryItems = async (req, res, next) => {
    try {
        const items = await LibraryItem.find({ user: req.user.id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all public library items
// @route   GET /api/library/public
// @access  Public
exports.getPublicLibraryItems = async (req, res, next) => {
    try {
        const items = await LibraryItem.find({ isPublic: true })
            .populate('user', 'name') // include creator name
            .sort({ createdAt: -1 });

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
        // Handle mapping if frontend sends 'shapes'
        if (req.body.shapes && !req.body.elements) {
            req.body.elements = req.body.shapes;
        }

        const item = await LibraryItem.create({
            ...req.body,
            user: req.user.id
        });

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
            return res.status(404).json({ success: false, error: 'Library item not found' });
        }

        // Make sure user owns item
        if (item.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
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

// @desc    Update library item
// @route   PATCH /api/library/:id
// @access  Private
exports.updateLibraryItem = async (req, res, next) => {
    try {
        let item = await LibraryItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ success: false, error: 'Library item not found' });
        }

        // Make sure user owns item
        if (item.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        item = await LibraryItem.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (err) {
        next(err);
    }
};
