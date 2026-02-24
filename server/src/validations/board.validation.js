const { z } = require('zod');

exports.createBoardSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name cannot be more than 50 characters'),
    description: z.string().max(500, 'Description cannot be more than 500 characters').optional(),
    workspaceId: z.string().optional(),
    visibility: z.enum(['workspace', 'private']).optional(),
    linkAccess: z.enum(['none', 'view', 'edit']).optional(),
    members: z.array(z.object({
        userId: z.string(),
        role: z.enum(['editor', 'viewer'])
    })).optional(),
    isLive: z.boolean().optional(),
    shapes: z.array(z.any()).optional() // Basic validation, can be stricter if shape structure is known
});

exports.updateBoardSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name cannot be more than 50 characters').optional(),
    description: z.string().max(500, 'Description cannot be more than 500 characters').optional(),
    shapes: z.array(z.any()).optional(),
    workspaceId: z.string().optional(),
    visibility: z.enum(['workspace', 'private']).optional(),
    linkAccess: z.enum(['none', 'view', 'edit']).optional(),
    members: z.array(z.object({
        userId: z.string(),
        role: z.enum(['editor', 'viewer'])
    })).optional(),
    isLive: z.boolean().optional(),
    thumbnailUrl: z.string().optional(),
    version: z.number().optional() // For optimistic concurrency
});
