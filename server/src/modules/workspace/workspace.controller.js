const Workspace = require('../../models/Workspace');

// @desc    Get all workspaces for user
// @route   GET /api/workspaces
// @access  Private
exports.getWorkspaces = async (req, res, next) => {
    try {
        const workspaces = await Workspace.find({
            $or: [
                { ownerId: req.user.id },
                { 'members.userId': req.user.id }
            ]
        });

        res.status(200).json({
            success: true,
            count: workspaces.length,
            data: workspaces
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new workspace
// @route   POST /api/workspaces
// @access  Private
exports.createWorkspace = async (req, res, next) => {
    try {
        const { name } = req.body;

        const workspace = await Workspace.create({
            name,
            ownerId: req.user.id,
            members: [{ userId: req.user.id, role: 'admin' }]
        });

        res.status(201).json({
            success: true,
            data: workspace
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update workspace
// @route   PUT /api/workspaces/:id
// @access  Private
exports.updateWorkspace = async (req, res, next) => {
    try {
        let workspace = await Workspace.findById(req.params.id);

        if (!workspace) {
            return res.status(404).json({ success: false, error: 'Workspace not found' });
        }

        // Must be owner or admin
        const member = workspace.members.find(m => m.userId.toString() === req.user.id);
        const isAdmin = member && member.role === 'admin';
        if (workspace.ownerId.toString() !== req.user.id && !isAdmin) {
            return res.status(401).json({ success: false, error: 'Not authorized to update this workspace' });
        }

        workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: workspace
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete workspace
// @route   DELETE /api/workspaces/:id
// @access  Private
exports.deleteWorkspace = async (req, res, next) => {
    try {
        const workspace = await Workspace.findById(req.params.id);

        if (!workspace) {
            return res.status(404).json({ success: false, error: 'Workspace not found' });
        }

        if (workspace.ownerId.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Only the owner can delete a workspace' });
        }

        await workspace.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add member to workspace
// @route   POST /api/workspaces/:id/members
// @access  Private
exports.addMember = async (req, res, next) => {
    try {
        const { userId, role } = req.body;
        const workspace = await Workspace.findById(req.params.id);

        if (!workspace) return res.status(404).json({ success: false, error: 'Workspace not found' });

        const member = workspace.members.find(m => m.userId.toString() === req.user.id);
        const isAdmin = member && member.role === 'admin';
        if (workspace.ownerId.toString() !== req.user.id && !isAdmin) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        if (workspace.members.find(m => m.userId.toString() === userId)) {
            return res.status(400).json({ success: false, error: 'User already in workspace' });
        }

        workspace.members.push({ userId, role: role || 'viewer' });
        await workspace.save();

        res.status(200).json({ success: true, data: workspace });
    } catch (err) {
        next(err);
    }
}

// @desc    Remove member from workspace
// @route   DELETE /api/workspaces/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res, next) => {
    try {
        const workspace = await Workspace.findById(req.params.id);

        if (!workspace) return res.status(404).json({ success: false, error: 'Workspace not found' });

        const member = workspace.members.find(m => m.userId.toString() === req.user.id);
        const isAdmin = member && member.role === 'admin';
        if (workspace.ownerId.toString() !== req.user.id && !isAdmin && req.params.userId !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        workspace.members = workspace.members.filter(m => m.userId.toString() !== req.params.userId);
        await workspace.save();

        res.status(200).json({ success: true, data: workspace });
    } catch (err) {
        next(err);
    }
}
