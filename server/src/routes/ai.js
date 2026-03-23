const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { decryptKey } = require('../utils/encryption');
const { checkAndIncrementUsage } = require('../utils/rateLimiter');
const { Groq } = require('groq-sdk');
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Generate AI Content
// @route   POST /api/ai/generate
// @access  Private
router.post('/generate', protect, async (req, res) => {
    try {
        // 1. Rate Limiting Check
        const usage = await checkAndIncrementUsage(req.user);
        if (!usage.allowed) {
            return res.status(429).json({
                success: false,
                message: usage.message
            });
        }

        // 2. Resolve provider and key
        let resolvedProvider = req.user.aiConfig.defaultProvider;
        let encryptedKey = req.user.aiConfig.keys[resolvedProvider];
        let resolvedKey;
        let resolvedModel;

        if (encryptedKey) {
            resolvedKey = decryptKey(encryptedKey);
            resolvedModel = req.user.aiConfig.preferredModels[resolvedProvider];
        } else {
            // Fallback: check any other key saved
            const availableProviders = Object.keys(req.user.aiConfig.keys).filter(p => req.user.aiConfig.keys[p] !== null);
            
            if (availableProviders.length > 0) {
                resolvedProvider = availableProviders[0];
                resolvedKey = decryptKey(req.user.aiConfig.keys[resolvedProvider]);
                resolvedModel = req.user.aiConfig.preferredModels[resolvedProvider];
            } else {
                // System fallback: your GROQ key
                resolvedProvider = 'groq';
                resolvedKey = process.env.VITE_GROQ_API_KEY; // Re-use the existing key in .env
                resolvedModel = 'llama-3.3-70b-versatile';
            }
        }

        if (!resolvedKey) {
            return res.status(500).json({ success: false, message: "AI Configuration error: No key found." });
        }

        // 3. Make the API Call
        let resultText = '';
        const { systemPrompt, userPrompt } = req.body;

        try {
            if (resolvedProvider === 'groq') {
                const groq = new Groq({ apiKey: resolvedKey });
                const completion = await groq.chat.completions.create({
                    model: resolvedModel,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: req.body.temperature || 0.2,
                    response_format: req.body.response_format
                });
                resultText = completion.choices[0]?.message?.content || "";
            } 
            else if (resolvedProvider === 'openai') {
                const openai = new OpenAI({ apiKey: resolvedKey });
                const completion = await openai.chat.completions.create({
                    model: resolvedModel,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: req.body.temperature || 0.2,
                    response_format: req.body.response_format
                });
                resultText = completion.choices[0]?.message?.content || "";
            }
            else if (resolvedProvider === 'anthropic') {
                const anthropic = new Anthropic({ apiKey: resolvedKey });
                const msg = await anthropic.messages.create({
                    model: resolvedModel,
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: [{ role: "user", content: userPrompt }],
                    temperature: req.body.temperature || 0.2
                });
                // Anthropic provides content as an array of blocks
                resultText = msg.content.filter(block => block.type === 'text').map(block => block.text).join('\n');
            }
            else if (resolvedProvider === 'gemini') {
                const genAI = new GoogleGenerativeAI(resolvedKey);
                const model = genAI.getGenerativeModel({ model: resolvedModel });
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Request: ${userPrompt}` }] }],
                    generationConfig: {
                        temperature: req.body.temperature || 0.2,
                    }
                });
                resultText = result.response.text();
            }
        } catch (apiError) {
            console.error(`AI Provider Error [${resolvedProvider}]:`, apiError.message);
            
            // Step 6: Specific error handling
            if (apiError.status === 401 || apiError.message.includes('401') || apiError.message.toLowerCase().includes('invalid api key')) {
                return res.status(401).json({
                    success: false,
                    message: "Your API key was rejected. Please update it in profile settings."
                });
            }
            
            if (apiError.status === 429 || apiError.message.includes('429')) {
                return res.status(429).json({
                    success: false,
                    message: "Your API key has hit its rate limit."
                });
            }

            throw apiError; // bubble up for generic error handler
        }

        // 5. Normalize response
        res.status(200).json({
            success: true,
            result: resultText,
            provider: resolvedProvider,
            model: resolvedModel,
            remaining: usage.unlimited ? null : usage.remaining
        });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({
            success: false,
            message: "AI generation failed. Please try again."
        });
    }
});

module.exports = router;
