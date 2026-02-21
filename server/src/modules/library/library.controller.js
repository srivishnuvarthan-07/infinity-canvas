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

// @desc    Create library item
// @route   POST /api/library
// @access  Private
exports.createLibraryItem = async (req, res, next) => {
    try {
        req.body.user = req.user.id;

        // frontend might send 'shapes' but model expects 'elements'
        // Let's handle mapping if needed, or assume frontend is smart.
        // If frontend sends { shapes: [...] }, we need to map to { elements: [...] } OR update schema.
        // Let's create it directly from body for now, assuming frontend matches or we adapt here.
        if (req.body.shapes && !req.body.elements) {
            req.body.elements = req.body.shapes;
        }

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
