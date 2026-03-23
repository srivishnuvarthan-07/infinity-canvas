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
        enum: ['private'],
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

BoardSchema.pre('save', function (next) {
    this.lastModified = Date.now();
    next();
});

BoardSchema.methods.hasAccess = async function (user, action = 'view') {
    if (!user) {
        if (action === 'view') return this.linkAccess === 'view' || this.linkAccess === 'edit';
        if (action === 'edit') return this.linkAccess === 'edit';
        return false;
    }

    const userId = user._id ? user._id.toString() : user.id;
    const ownerId = this.owner._id ? this.owner._id.toString() : this.owner.toString();

    // 2. Owner has full access
    if (ownerId === userId) return true;

    // 3. Board-Level Role Check
    const boardMember = this.members.find(m => m.userId.toString() === userId);
    const boardRole = boardMember ? boardMember.role : null;

    if (action === 'view') {
        if (boardRole) return true;
    }

    if (action === 'edit') {
        if (boardRole === 'editor') return true;
    }

    return false;
};
module.exports = mongoose.model('Board', BoardSchema);
