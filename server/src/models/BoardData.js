const mongoose = require('mongoose');

const BoardDataSchema = new mongoose.Schema({
    boardId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Board',
        required: true,
        unique: true,
        index: true
    },
    data: {
        type: Object,
        default: {} // Stores the shapes, viewport, etc.
    },
    version: {
        type: Number,
        default: 1
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
BoardDataSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('BoardData', BoardDataSchema);
