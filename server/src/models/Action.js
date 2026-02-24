const mongoose = require('mongoose');

const ActionSchema = new mongoose.Schema({
    boardId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Board',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    actionId: {
        type: String,
        required: true,
        unique: true
    },
    actionType: {
        type: String,
        enum: ['ADD', 'UPDATE', 'DELETE', 'REORDER'],
        required: true
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('Action', ActionSchema);
