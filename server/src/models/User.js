const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'publisher'],
        default: 'user'
    },
    provider: {
        type: String,
        default: 'local'
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    avatarColor: {
        type: String,
        default: '#7F77DD'
    },
    defaultStorage: {
        type: String,
        enum: ['cloud', 'local'],
        default: 'cloud'
    },
    aiConfig: {
        defaultProvider: {
            type: String,
            enum: ['groq', 'openai', 'anthropic', 'gemini'],
            default: 'groq'
        },
        keys: {
            groq:      { type: String, default: null },
            openai:    { type: String, default: null },
            anthropic: { type: String, default: null },
            gemini:    { type: String, default: null }
        },
        preferredModels: {
            groq:      { type: String, default: 'llama-3.3-70b-versatile' },
            openai:    { type: String, default: 'gpt-4o-mini' },
            anthropic: { type: String, default: 'claude-haiku-20240307' },
            gemini:    { type: String, default: 'gemini-1.5-flash' }
        },
        freeUsage: {
            count:     { type: Number, default: 0 },
            resetDate: { type: String, default: null }
        }
    },
    tokenVersion: {
        type: Number,
        default: 0
    }
});


// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, tokenVersion: this.tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
