import { z } from "zod";

/**
 * Workflow data schema matching React Flow structure
 */
export const workflowDataSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      data: z.record(z.string(), z.any()),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional(),
      type: z.string().optional(),
      animated: z.boolean().optional(),
    })
  ),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .optional(),
});

/**
 * Create workflow input schema
 */
export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required").max(255),
  description: z.string().optional(),
  data: workflowDataSchema,
  folderId: z.string().optional(),
});

/**
 * Update workflow input schema
 */
export const updateWorkflowSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  data: workflowDataSchema.optional(),
  folderId: z.string().optional().nullable(),
});

/**
 * Delete workflow input schema
 */
export const deleteWorkflowSchema = z.object({
  id: z.string(),
});

/**
 * Get workflow by ID schema
 */
export const getWorkflowSchema = z.object({
  id: z.string(),
});

/**
 * LLM execution input schema
 */
export const executeLLMSchema = z.object({
  model: z.string().default("gemini-2.5-flash"),
  systemPrompt: z.string().optional(),
  userMessage: z.string().min(1, "User message is required"),
  images: z.array(z.string()).optional(), // Base64 encoded images
  temperature: z.number().min(0).max(2).optional().default(1),
  maxTokens: z.number().optional(),
});

/**
 * Workflow execution status schema
 */
export const workflowExecutionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  userId: z.string(),
  nodeId: z.string(),
  status: z.enum(["running", "completed", "failed"]),
  input: z.record(z.string(), z.any()).optional(),
  output: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});
