/**
 * Config-Driven Node System
 * 
 * This module defines the schema for node configurations.
 * Each node type is defined by a single config file that generates:
 * - Zod input/output schemas
 * - React component UI
 * - Handle definitions
 * - Cost calculation logic
 * 
 * This ensures a single source of truth per node type.
 */

import { z } from "zod";

// ============================================================================
// Handle Types
// ============================================================================

/**
 * Available data types for node handles
 */
export const HandleDataType = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  NUMBER: "number",
  BOOLEAN: "boolean",
  JSON: "json",
  FILE: "file",
} as const;

export type HandleDataType = typeof HandleDataType[keyof typeof HandleDataType];

/**
 * Handle direction (input or output)
 */
export const HandleDirection = {
  INPUT: "input",
  OUTPUT: "output",
} as const;

export type HandleDirection = typeof HandleDirection[keyof typeof HandleDirection];

/**
 * Handle color palette (for visual differentiation)
 */
export const HandleColors: Record<HandleDataType, string> = {
  text: "#10B981", // Emerald
  image: "#3B82F6", // Blue
  video: "#8B5CF6", // Violet
  audio: "#F59E0B", // Amber
  number: "#EC4899", // Pink
  boolean: "#6366F1", // Indigo
  json: "#14B8A6", // Teal
  file: "#78716C", // Stone
};

// ============================================================================
// Handle Definition
// ============================================================================

/**
 * Definition for a single handle on a node
 */
export interface HandleDefinition {
  /** Unique ID within the node */
  id: string;
  /** Human-readable label */
  label: string;
  /** Data type this handle accepts/produces */
  dataType: HandleDataType;
  /** Input or output */
  direction: HandleDirection;
  /** Whether this handle is required */
  required: boolean;
  /** Whether this can accept multiple connections */
  multiple?: boolean;
  /** Description shown in tooltip */
  description?: string;
  /** Default value if not connected */
  defaultValue?: unknown;
}

// ============================================================================
// Parameter Types
// ============================================================================

/**
 * Base parameter definition
 */
interface BaseParameterDef {
  /** Unique parameter ID */
  id: string;
  /** Display label */
  label: string;
  /** Description/help text */
  description?: string;
  /** Whether parameter is required */
  required: boolean;
  /** Whether this is an advanced setting (collapsible) */
  advanced?: boolean;
  /** Whether this parameter has a corresponding input handle */
  hasConnector: boolean;
  /** Group for organizing parameters */
  group?: string;
}

/**
 * Text parameter
 */
export interface TextParameterDef extends BaseParameterDef {
  type: "text";
  defaultValue?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
}

/**
 * Number parameter
 */
export interface NumberParameterDef extends BaseParameterDef {
  type: "number";
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * Select parameter (dropdown)
 */
export interface SelectParameterDef extends BaseParameterDef {
  type: "select";
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  defaultValue?: string;
}

/**
 * Boolean parameter (toggle/checkbox)
 */
export interface BooleanParameterDef extends BaseParameterDef {
  type: "boolean";
  defaultValue?: boolean;
}

/**
 * Slider parameter
 */
export interface SliderParameterDef extends BaseParameterDef {
  type: "slider";
  defaultValue?: number;
  min: number;
  max: number;
  step?: number;
  marks?: Array<{ value: number; label: string }>;
}

/**
 * Image upload parameter
 */
export interface ImageParameterDef extends BaseParameterDef {
  type: "image";
  acceptedFormats?: string[];
  maxSizeMb?: number;
}

/**
 * File upload parameter
 */
export interface FileParameterDef extends BaseParameterDef {
  type: "file";
  acceptedFormats?: string[];
  maxSizeMb?: number;
  multiple?: boolean;
}

/**
 * Union of all parameter types
 */
export type ParameterDefinition =
  | TextParameterDef
  | NumberParameterDef
  | SelectParameterDef
  | BooleanParameterDef
  | SliderParameterDef
  | ImageParameterDef
  | FileParameterDef;

// ============================================================================
// Node Categories
// ============================================================================

/**
 * Node category for sidebar grouping
 */
export const NodeCategory = {
  INPUT: "input",
  OUTPUT: "output",
  AI_IMAGE: "ai-image",
  AI_VIDEO: "ai-video",
  AI_AUDIO: "ai-audio",
  AI_LLM: "ai-llm",
  TRANSFORM: "transform",
  UTILITY: "utility",
} as const;

export type NodeCategory = typeof NodeCategory[keyof typeof NodeCategory];

/**
 * Category metadata for UI
 */
export const NodeCategoryMeta: Record<NodeCategory, { label: string; icon: string; color: string }> = {
  input: { label: "Input", icon: "ArrowDownToLine", color: "#10B981" },
  output: { label: "Output", icon: "ArrowUpFromLine", color: "#3B82F6" },
  "ai-image": { label: "AI Image", icon: "Image", color: "#8B5CF6" },
  "ai-video": { label: "AI Video", icon: "Video", color: "#EC4899" },
  "ai-audio": { label: "AI Audio", icon: "AudioLines", color: "#F59E0B" },
  "ai-llm": { label: "AI LLM", icon: "Brain", color: "#6366F1" },
  transform: { label: "Transform", icon: "Wand2", color: "#14B8A6" },
  utility: { label: "Utility", icon: "Wrench", color: "#78716C" },
};

// ============================================================================
// Node Configuration
// ============================================================================

/**
 * Complete configuration for a node type
 * This is the single source of truth for each node
 */
export interface NodeConfig {
  /** Unique node type identifier */
  type: string;
  
  /** Human-readable name */
  name: string;
  
  /** Short description */
  description: string;
  
  /** Category for sidebar grouping */
  category: NodeCategory;
  
  /** Icon name (from Lucide) */
  icon: string;
  
  /** Node color/theme */
  color: string;
  
  /** Version for schema migrations */
  version: string;
  
  /** Provider ID (for AI nodes) */
  providerId?: string;
  
  /** Fallback provider IDs in order */
  fallbackProviders?: string[];
  
  /** Input handles */
  inputs: HandleDefinition[];
  
  /** Output handles */
  outputs: HandleDefinition[];
  
  /** Configurable parameters */
  parameters: ParameterDefinition[];
  
  /** Default parameter values */
  defaultValues: Record<string, unknown>;
  
  /** Cost calculation configuration */
  costConfig: NodeCostConfig;
  
  /** Documentation URL */
  docsUrl?: string;
  
  /** Tags for search */
  tags?: string[];
}

/**
 * Cost configuration for a node
 */
export interface NodeCostConfig {
  /** Base cost per execution (in credits, 1M = $1) */
  baseCost: number;
  /** Variable cost factors */
  variableCosts?: {
    /** Cost per input token (for LLMs) */
    perInputToken?: number;
    /** Cost per output token (for LLMs) */
    perOutputToken?: number;
    /** Cost per second of output (video/audio) */
    perSecond?: number;
    /** Cost per megapixel of output (images) */
    perMegapixel?: number;
  };
}

// ============================================================================
// Node Registry Types
// ============================================================================

/**
 * Registry for all node configurations
 */
export interface INodeRegistry {
  /**
   * Register a node configuration
   */
  register(config: NodeConfig): void;
  
  /**
   * Get node configuration by type
   */
  get(type: string): NodeConfig | undefined;
  
  /**
   * Get all registered node types
   */
  getAll(): NodeConfig[];
  
  /**
   * Get nodes by category
   */
  getByCategory(category: NodeCategory): NodeConfig[];
  
  /**
   * Search nodes by query
   */
  search(query: string): NodeConfig[];
}

// ============================================================================
// Schema Generation
// ============================================================================

/**
 * Generate Zod schema from parameter definitions
 * 
 * @param parameters - Array of parameter definitions
 * @returns Zod object schema
 */
export function generateInputSchema(
  parameters: ParameterDefinition[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const param of parameters) {
    let schema: z.ZodTypeAny;
    
    switch (param.type) {
      case "text":
        schema = z.string();
        if (param.minLength) schema = (schema as z.ZodString).min(param.minLength);
        if (param.maxLength) schema = (schema as z.ZodString).max(param.maxLength);
        if (param.defaultValue) schema = schema.default(param.defaultValue);
        break;
        
      case "number":
        schema = z.number();
        if (param.min !== undefined) schema = (schema as z.ZodNumber).min(param.min);
        if (param.max !== undefined) schema = (schema as z.ZodNumber).max(param.max);
        if (param.defaultValue !== undefined) schema = schema.default(param.defaultValue);
        break;
        
      case "select":
        schema = z.enum(param.options.map(o => o.value) as [string, ...string[]]);
        if (param.defaultValue) schema = schema.default(param.defaultValue);
        break;
        
      case "boolean":
        schema = z.boolean();
        if (param.defaultValue !== undefined) schema = schema.default(param.defaultValue);
        break;
        
      case "slider":
        schema = z.number().min(param.min).max(param.max);
        if (param.defaultValue !== undefined) schema = schema.default(param.defaultValue);
        break;
        
      case "image":
        schema = z.string().url();
        break;
        
      case "file":
        schema = param.multiple
          ? z.array(z.string().url())
          : z.string().url();
        break;
        
      default:
        schema = z.unknown();
    }
    
    // Add description
    if (param.description) {
      schema = schema.describe(param.description);
    }
    
    // Make optional if not required
    if (!param.required) {
      schema = schema.optional();
    }
    
    shape[param.id] = schema;
  }
  
  return z.object(shape);
}

/**
 * Generate handle connection Zod schema
 * 
 * @param handles - Array of handle definitions
 * @returns Zod object schema for handle values
 */
export function generateHandleSchema(
  handles: HandleDefinition[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const handle of handles) {
    let schema: z.ZodTypeAny;
    
    switch (handle.dataType) {
      case "text":
        schema = z.string();
        break;
      case "image":
      case "video":
      case "audio":
      case "file":
        schema = z.string().url();
        break;
      case "number":
        schema = z.number();
        break;
      case "boolean":
        schema = z.boolean();
        break;
      case "json":
        schema = z.record(z.string(), z.unknown());
        break;
      default:
        schema = z.unknown();
    }
    
    // Handle multiple connections
    if (handle.multiple) {
      schema = z.array(schema);
    }
    
    // Add description
    if (handle.description) {
      schema = schema.describe(handle.description);
    }
    
    // Make optional if not required
    if (!handle.required) {
      schema = schema.optional();
    }
    
    shape[handle.id] = schema;
  }
  
  return z.object(shape);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all input handles from a node config
 */
export function getInputHandles(config: NodeConfig): HandleDefinition[] {
  return config.inputs;
}

/**
 * Get all output handles from a node config
 */
export function getOutputHandles(config: NodeConfig): HandleDefinition[] {
  return config.outputs;
}

/**
 * Get required parameters from a node config
 */
export function getRequiredParameters(config: NodeConfig): ParameterDefinition[] {
  return config.parameters.filter(p => p.required);
}

/**
 * Get advanced parameters from a node config
 */
export function getAdvancedParameters(config: NodeConfig): ParameterDefinition[] {
  return config.parameters.filter(p => p.advanced);
}

/**
 * Get parameters by group
 */
export function getParametersByGroup(
  config: NodeConfig
): Map<string, ParameterDefinition[]> {
  const groups = new Map<string, ParameterDefinition[]>();
  
  for (const param of config.parameters) {
    const group = param.group || "default";
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(param);
  }
  
  return groups;
}
