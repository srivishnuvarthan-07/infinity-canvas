const { z } = require('zod');

exports.registerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please include a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

exports.loginSchema = z.object({
    email: z.string().email('Please include a valid email'),
    password: z.string().min(1, 'Password is required')
});
