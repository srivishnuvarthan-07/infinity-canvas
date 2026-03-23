import { z } from "zod";

export const BaseNodeSchema = z.object({
    id: z.string().min(1),
    label: z.string().optional(),
    type: z.string().default("rectangle"),
    direction: z.enum(['TB', 'LR']).optional(),
});

export const NodeSchema = BaseNodeSchema.extend({
    nodes: z.lazy(() => z.array(NodeSchema).optional()),
});

export const EdgeSchema = z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    label: z.string().optional(),
});

export const GraphSchema = z.object({
    // Diagram fields
    direction: z.enum(['TB', 'LR']).optional().default('TB'),
    nodes: z.array(NodeSchema).max(50).optional(),
    edges: z.array(EdgeSchema).optional(),

    // Sketch fields
    paths: z.array(z.object({
        d: z.string(),
        stroke: z.string().optional(),
        strokeWidth: z.number().optional(),
        fill: z.string().optional()
    })).optional(),
    viewBox: z.object({
        x: z.number().optional(),
        y: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional()
    }).optional()
}).refine(data => (data.nodes && data.nodes.length > 0) || (data.paths && data.paths.length > 0), {
    message: "Must provide either nodes for a diagram or paths for a sketch"
});

/**
 * Validates raw JSON object against the GraphSchema
 * @param {any} data Raw JSON object
 * @returns {{ success: boolean, data?: { nodes: any[], edges: any[] }, error?: z.ZodError }}
 */
export function validateGraph(data) {
    return GraphSchema.safeParse(data);
}
