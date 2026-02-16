const { z } = require('zod');

/**
 * Middleware to validate request body against a Zod schema
 * @param {z.ZodSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            const errorMessage = err.errors.map((e) => e.message).join(', ');
            return res.status(400).json({
                success: false,
                error: errorMessage
            });
        }
        next(err);
    }
};

module.exports = validate;
