const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a board name'],
        trim: true,
        maxlength: [100, 'Name can not be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description can not be more than 500 characters']
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    workspaceId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Workspace',
        required: false // Optional for now until Workspaces are fully integrated
    },
    members: [{
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['editor', 'viewer'],
            default: 'viewer'
        }
    }],
    shareToken: {
        type: String,
        unique: true,
        sparse: true
    },
    thumbnailUrl: {
        type: String
    },
    visibility: {
        type: String,
        enum: ['workspace', 'private'],
        default: 'private'
    },
    linkAccess: {
        type: String,
        enum: ['none', 'view', 'edit'],
        default: 'none'
    },
    isLive: {
        type: Boolean,
        default: false
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Update lastModified timestamp before saving
BoardSchema.pre('save', function (next) {
    this.lastModified = Date.now();
    next();
});

// Authorization Helper Method
BoardSchema.methods.hasAccess = async function (user, action = 'view') {
    // 1. Unauthenticated Guest Check
    if (!user) {
        if (action === 'view') return this.linkAccess === 'view' || this.linkAccess === 'edit';
        if (action === 'edit') return this.linkAccess === 'edit';
        return false;
    }

    const userId = user._id ? user._id.toString() : user.id;
    const ownerId = this.owner._id ? this.owner._id.toString() : this.owner.toString();

    // 2. Owner has full access
    if (ownerId === userId) return true;

    // 3. Check Workspace Membership (if board belongs to workspace)
    let isWorkspaceMember = false;
    let workspaceRole = null;
    if (this.workspaceId) {
        try {
            const Workspace = mongoose.model('Workspace');
            const workspace = await Workspace.findById(this.workspaceId);
            if (workspace) {
                const member = workspace.members.find(m => m.userId.toString() === userId);
                if (member) {
                    isWorkspaceMember = true;
                    workspaceRole = member.role;
                }
            }
        } catch (err) {
            console.error('Error checking workspace membership in hasAccess:', err);
        }
    }

    // 4. Board-Level Role Check
    const boardMember = this.members.find(m => m.userId.toString() === userId);
    const boardRole = boardMember ? boardMember.role : null;

    if (action === 'view') {
        // Can view if linkAccess allows
        if (this.linkAccess === 'view' || this.linkAccess === 'edit') return true;
        // Can view if board is workspace-visible and user is in workspace
        if (this.visibility === 'workspace' && isWorkspaceMember) return true;
        // Can view if explicitly added to board
        if (boardRole) return true;
    }

    if (action === 'edit') {
        // Can edit if linkAccess allows
        if (this.linkAccess === 'edit') return true;
        // Can edit if workspace admin/editor AND board is workspace-visible
        if (this.visibility === 'workspace' && isWorkspaceMember && (workspaceRole === 'admin' || workspaceRole === 'editor')) return true;
        // Can edit if explicitly added to board as editor
        if (boardRole === 'editor') return true;
    }

    return false;
};

module.exports = mongoose.model('Board', BoardSchema);
