const { z } = require('zod');

exports.createLibraryItemSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name cannot be more than 50 characters'),
    elements: z.array(z.any()).min(1, 'elements must not be empty'),
    category: z.string().optional(),
    isPublic: z.boolean().optional()
});
