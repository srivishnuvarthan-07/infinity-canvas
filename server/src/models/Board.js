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
    participants: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    shareToken: {
        type: String,
        unique: true,
        sparse: true
    },
    thumbnailUrl: {
        type: String
    },
    isPublic: {
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

module.exports = mongoose.model('Board', BoardSchema);
