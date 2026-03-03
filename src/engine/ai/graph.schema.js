import { z } from "zod";

export const NodeSchema = z.object({
    id: z.string().min(1),
    label: z.string(),
    type: z.enum(["rectangle", "ellipse", "diamond"]).default("rectangle"),
});

export const EdgeSchema = z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    label: z.string().optional(),
});

export const GraphSchema = z.object({
    direction: z.enum(['TB', 'LR']).optional().default('TB'),
    nodes: z.array(NodeSchema).min(1).max(30),
    edges: z.array(EdgeSchema),
});

/**
 * Validates raw JSON object against the GraphSchema
 * @param {any} data Raw JSON object
 * @returns {{ success: boolean, data?: { nodes: any[], edges: any[] }, error?: z.ZodError }}
 */
export function validateGraph(data) {
    return GraphSchema.safeParse(data);
}
