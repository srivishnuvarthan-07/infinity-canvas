const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a board name'],
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description can not be more than 500 characters']
    },
    // We store shapes as a mixed type array for flexibility (JSON structure)
    shapes: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    // Versioning for optimistic concurrency control
    version: {
        type: Number,
        default: 1
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    deletedAt: {
        type: Date,
        default: null,
        select: false // Hide naturally
    }
});

// Index for fetching user's boards sorted by recent activity
BoardSchema.index({ user: 1, updatedAt: -1 });

// Update the updatedAt timestamp before saving
BoardSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Board', BoardSchema);
