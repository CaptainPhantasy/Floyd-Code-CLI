import { z } from 'zod';

// Basic geometry types
export const RectSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
});

// Style definition
export const StyleSchema = z.object({
  border: z.boolean().default(true),
  borderStyle: z.enum(['single', 'round', 'double', 'bold']).default('round'),
  padding: z.number().min(0).max(2).default(0),
  color: z.enum(['cyan', 'magenta', 'green', 'yellow', 'white', 'gray']).optional(),
  dim: z.boolean().optional(),
});

// Node types
export const NodeTypeSchema = z.enum([
  'frame', 'header', 'sidebar', 'main', 'footer', 'status', 
  'panel', 'list', 'table', 'log', 'input', 'text'
]);

// A single node in the layout tree
// Note: We use a recursive structure definition approach if needed, 
// but for the spec, a flat list with parentId or a simple tree is fine.
// Here we define a node that will be stored in a flat list for the editor,
// but structure for the generated spec.
export const LayoutNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: NodeTypeSchema,
  rect: RectSchema,
  style: StyleSchema,
  content: z.object({
    title: z.string().optional(),
    placeholderText: z.string().optional(),
  }).optional(),
});

export type LayoutNode = z.infer<typeof LayoutNodeSchema>;

// The full screen specification
export const ScreenSpecSchema = z.object({
  meta: z.object({
    name: z.string(),
    createdAt: z.string(),
    cols: z.number(),
    rows: z.number(),
    imagePath: z.string().optional(),
  }),
  theme: z.object({
    preset: z.string().default('floyd-neon'),
  }),
  nodes: z.array(LayoutNodeSchema),
});

export type ScreenSpec = z.infer<typeof ScreenSpecSchema>;
