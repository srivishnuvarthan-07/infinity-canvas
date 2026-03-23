const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { encryptKey } = require('../utils/encryption');
const { Groq } = require('groq-sdk');
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Update user profile data
// @route   PUT /api/profile/update
// @access  Private
router.put('/update', protect, async (req, res) => {
    try {
        const { name, avatarColor, defaultStorage } = req.body;
        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        if (name) user.name = name;
        if (avatarColor) user.avatarColor = avatarColor;
        if (defaultStorage) user.defaultStorage = defaultStorage;

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarColor: user.avatarColor,
                defaultStorage: user.defaultStorage
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Get user AI config
// @route   GET /api/profile/ai-config
// @access  Private
router.get('/ai-config', protect, async (req, res) => {
    const { aiConfig } = req.user;
    
    const configResponse = {
        defaultProvider: aiConfig.defaultProvider,
        preferredModels: aiConfig.preferredModels,
        freeUsage: aiConfig.freeUsage,
        providers: {
            groq:      { hasKey: !!aiConfig.keys.groq },
            openai:    { hasKey: !!aiConfig.keys.openai },
            anthropic: { hasKey: !!aiConfig.keys.anthropic },
            gemini:    { hasKey: !!aiConfig.keys.gemini }
        }
    };

    res.status(200).json({
        success: true,
        data: configResponse
    });
});

// @desc    Add/Update provider API key
// @route   POST /api/profile/ai-config/key
// @access  Private
router.post('/ai-config/key', protect, async (req, res) => {
    const { provider, key } = req.body;

    if (!['groq', 'openai', 'anthropic', 'gemini'].includes(provider)) {
        return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    if (!key || key.trim() === '') {
        return res.status(400).json({ success: false, error: 'API key is required' });
    }

    // Test the key before saving
    try {
        if (provider === 'groq') {
            const groq = new Groq({ apiKey: key });
            await groq.models.list();
        } else if (provider === 'openai') {
            const openai = new OpenAI({ apiKey: key });
            await openai.models.list();
        } else if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey: key });
            // Minimal call: attempt to list models or similar
            // Anthropic doesn't have a simple list models like OpenAI, but we can try a tiny message
            await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'hi' }]
            });
        } else if (provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            await model.generateContent('hi');
        }
    } catch (err) {
        console.error(`Validation failed for ${provider}:`, err.message);
        return res.status(400).json({ success: false, error: 'Invalid API key' });
    }

    // Encrypt and save
    try {
        const encryptedKey = encryptKey(key);
        req.user.aiConfig.keys[provider] = encryptedKey;
        await req.user.save();

        res.status(200).json({
            success: true,
            message: `${provider} API key saved successfully`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to save key' });
    }
});

// @desc    Delete provider API key
// @route   DELETE /api/profile/ai-config/key
// @access  Private
router.delete('/ai-config/key', protect, async (req, res) => {
    const { provider } = req.body;

    if (!['groq', 'openai', 'anthropic', 'gemini'].includes(provider)) {
        return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    req.user.aiConfig.keys[provider] = null;

    // Reset default if it was the deleted one
    if (req.user.aiConfig.defaultProvider === provider) {
        req.user.aiConfig.defaultProvider = 'groq';
    }

    await req.user.save();

    res.status(200).json({
        success: true,
        message: `${provider} API key removed`
    });
});

// @desc    Update default provider/model
// @route   PUT /api/profile/ai-config/default
// @access  Private
router.put('/ai-config/default', protect, async (req, res) => {
    const { provider, model } = req.body;

    if (!['groq', 'openai', 'anthropic', 'gemini'].includes(provider)) {
        return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    // Validate user has a key for it
    if (!req.user.aiConfig.keys[provider]) {
        return res.status(400).json({ success: false, error: `You must add a ${provider} API key first` });
    }

    req.user.aiConfig.defaultProvider = provider;
    if (model) {
        req.user.aiConfig.preferredModels[provider] = model;
    }

    await req.user.save();

    res.status(200).json({
        success: true,
        message: 'Default provider updated'
    });
});

// @desc    Get free usage info
// @route   GET /api/profile/ai-config/usage
// @access  Private
router.get('/ai-config/usage', protect, async (req, res) => {
    const { freeUsage } = req.user.aiConfig;
    const remaining = Math.max(0, 10 - freeUsage.count);

    res.status(200).json({
        success: true,
        count: freeUsage.count,
        resetDate: freeUsage.resetDate,
        remaining
    });
});

// --- DANGER ZONE ENDPOINTS ---

// @desc    Export all user data
// @route   GET /api/profile/export
router.get('/export', protect, async (req, res) => {
    try {
        const Board = require('../models/Board');
        const BoardData = require('../models/BoardData');
        const userId = req.user._id || req.user.id;
        const boards = await Board.find({ owner: userId });
        const exportData = [];

        for (const board of boards) {
            const boardData = await BoardData.findOne({ boardId: board._id });
            exportData.push({
                metadata: board,
                data: boardData ? boardData.data : { shapes: [] }
            });
        }

        res.status(200).json({ success: true, data: exportData });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Delete all user boards
// @route   DELETE /api/profile/boards
router.delete('/boards', protect, async (req, res) => {
    try {
        const Board = require('../models/Board');
        const BoardData = require('../models/BoardData');
        const userId = req.user._id || req.user.id;

        const boards = await Board.find({ owner: userId });
        const boardIds = boards.map(b => b._id);
        
        const dataResult = await BoardData.deleteMany({ boardId: { $in: boardIds } });
        const boardResult = await Board.deleteMany({ owner: userId });

        res.status(200).json({ 
            success: true, 
            message: `Deleted ${boardResult.deletedCount} boards and associated data.`,
            deletedCount: boardResult.deletedCount 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Delete user account
// @route   DELETE /api/profile/account
router.delete('/account', protect, async (req, res) => {
    try {
        const User = require('../models/User');
        const Board = require('../models/Board');
        const BoardData = require('../models/BoardData');
        const userId = req.user._id || req.user.id;

        const boards = await Board.find({ owner: userId });
        const boardIds = boards.map(b => b._id);
        
        await BoardData.deleteMany({ boardId: { $in: boardIds } });
        await Board.deleteMany({ owner: userId });
        await User.findByIdAndDelete(userId);

        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        res.status(200).json({ success: true, message: 'Account deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Logout all devices
// @route   POST /api/profile/logout-all
router.post('/logout-all', protect, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        user.tokenVersion += 1;
        await user.save();

        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        res.status(200).json({ success: true, message: 'Logged out all devices' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
