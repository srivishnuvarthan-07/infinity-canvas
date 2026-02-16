const mongoose = require('mongoose');

const LibraryItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name for the item'],
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    elements: {
        type: [mongoose.Schema.Types.Mixed],
        required: [true, 'Library item must have elements'],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'Library item cannot be empty'
        }
    },
    category: {
        type: String,
        default: 'General',
        trim: true
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
    }
});

// Index for efficient searching
LibraryItemSchema.index({ user: 1, category: 1 });
LibraryItemSchema.index({ isPublic: 1 });

module.exports = mongoose.model('LibraryItem', LibraryItemSchema);
