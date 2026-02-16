const { z } = require('zod');

exports.createBoardSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name cannot be more than 50 characters'),
    description: z.string().max(500, 'Description cannot be more than 500 characters').optional(),
    isPublic: z.boolean().optional(),
    shapes: z.array(z.any()).optional() // Basic validation, can be stricter if shape structure is known
});

exports.updateBoardSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name cannot be more than 50 characters').optional(),
    description: z.string().max(500, 'Description cannot be more than 500 characters').optional(),
    shapes: z.array(z.any()).optional(),
    isPublic: z.boolean().optional(),
    version: z.number().optional() // For optimistic concurrency
});
