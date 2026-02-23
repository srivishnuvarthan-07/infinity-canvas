const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['invite', 'share', 'mention', 'session_join'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    boardId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Board'
    },
    workspaceId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Workspace'
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);
