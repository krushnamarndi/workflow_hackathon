/**
 * Node Registry
 * 
 * Central registry for all node configurations.
 * Provides lookup, search, and categorization of node types.
 */

import {
  NodeConfig,
  NodeCategory,
  INodeRegistry,
  generateInputSchema,
  generateHandleSchema,
} from "./config-schema";
import { z } from "zod";

/**
 * Node Registry Implementation
 * 
 * @example
 * ```typescript
 * const registry = new NodeRegistry();
 * registry.register(seedreamConfig);
 * 
 * const config = registry.get("seedream-4.5");
 * const imageNodes = registry.getByCategory("ai-image");
 * const searchResults = registry.search("image generation");
 * ```
 */
export class NodeRegistry implements INodeRegistry {
  private nodes = new Map<string, NodeConfig>();
  private categoryIndex = new Map<NodeCategory, Set<string>>();
  private searchIndex = new Map<string, Set<string>>(); // term -> nodeTypes

  /**
   * Register a node configuration
   */
  register(config: NodeConfig): void {
    const { type, category, name, description, tags } = config;

    if (this.nodes.has(type)) {
      console.warn(`Node type "${type}" is already registered. Overwriting.`);
    }

    // Store the config
    this.nodes.set(type, config);

    // Update category index
    if (!this.categoryIndex.has(category)) {
      this.categoryIndex.set(category, new Set());
    }
    this.categoryIndex.get(category)!.add(type);

    // Update search index
    this.indexForSearch(type, [
      name.toLowerCase(),
      description.toLowerCase(),
      category,
      ...(tags || []).map(t => t.toLowerCase()),
    ]);
  }

  /**
   * Add terms to search index
   */
  private indexForSearch(nodeType: string, terms: string[]): void {
    for (const term of terms) {
      // Split into words and index each
      const words = term.split(/\s+/);
      for (const word of words) {
        if (word.length < 2) continue;
        
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set());
        }
        this.searchIndex.get(word)!.add(nodeType);
      }
    }
  }

  /**
   * Get a node configuration by type
   */
  get(type: string): NodeConfig | undefined {
    return this.nodes.get(type);
  }

  /**
   * Get all registered node configurations
   */
  getAll(): NodeConfig[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get nodes by category
   */
  getByCategory(category: NodeCategory): NodeConfig[] {
    const nodeTypes = this.categoryIndex.get(category);
    if (!nodeTypes) {
      return [];
    }
    return Array.from(nodeTypes)
      .map(type => this.nodes.get(type)!)
      .filter(Boolean);
  }

  /**
   * Search nodes by query string
   * Returns nodes where any indexed term starts with any query word
   */
  search(query: string): NodeConfig[] {
    if (!query.trim()) {
      return this.getAll();
    }

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
    const matchedTypes = new Set<string>();

    for (const queryWord of queryWords) {
      // Find all indexed terms that start with the query word
      for (const [term, types] of this.searchIndex) {
        if (term.startsWith(queryWord)) {
          for (const type of types) {
            matchedTypes.add(type);
          }
        }
      }
    }

    return Array.from(matchedTypes)
      .map(type => this.nodes.get(type)!)
      .filter(Boolean);
  }

  /**
   * Check if a node type is registered
   */
  has(type: string): boolean {
    return this.nodes.has(type);
  }

  /**
   * Remove a node configuration
   */
  unregister(type: string): boolean {
    const config = this.nodes.get(type);
    if (!config) {
      return false;
    }

    // Remove from category index
    this.categoryIndex.get(config.category)?.delete(type);

    // Remove from search index (approximate - leaves some orphan terms)
    for (const types of this.searchIndex.values()) {
      types.delete(type);
    }

    return this.nodes.delete(type);
  }

  /**
   * Clear all registered nodes
   */
  clear(): void {
    this.nodes.clear();
    this.categoryIndex.clear();
    this.searchIndex.clear();
  }

  /**
   * Get all categories with their node counts
   */
  getCategoryCounts(): Record<NodeCategory, number> {
    const counts: Partial<Record<NodeCategory, number>> = {};
    
    for (const [category, types] of this.categoryIndex) {
      counts[category] = types.size;
    }

    return counts as Record<NodeCategory, number>;
  }

  /**
   * Get the generated Zod input schema for a node type
   */
  getInputSchema(type: string): z.ZodObject<Record<string, z.ZodTypeAny>> | undefined {
    const config = this.nodes.get(type);
    if (!config) {
      return undefined;
    }
    return generateInputSchema(config.parameters);
  }

  /**
   * Get the generated Zod handle schema for a node type
   */
  getHandleSchema(
    type: string,
    direction: "input" | "output"
  ): z.ZodObject<Record<string, z.ZodTypeAny>> | undefined {
    const config = this.nodes.get(type);
    if (!config) {
      return undefined;
    }
    
    const handles = direction === "input" ? config.inputs : config.outputs;
    return generateHandleSchema(handles);
  }

  /**
   * Validate input against a node's schema
   */
  validateInput(type: string, input: unknown): { success: boolean; data?: unknown; error?: string } {
    const schema = this.getInputSchema(type);
    if (!schema) {
      return { success: false, error: `Node type "${type}" not found` };
    }

    const result = schema.safeParse(input);
    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      error: result.error.issues.map((e) => `${String(e.path.join("."))}: ${e.message}`).join("; "),
    };
  }

  /**
   * Get default values for a node type
   */
  getDefaultValues(type: string): Record<string, unknown> | undefined {
    const config = this.nodes.get(type);
    if (!config) {
      return undefined;
    }
    return { ...config.defaultValues };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global node registry instance
 */
export const nodeRegistry = new NodeRegistry();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all nodes grouped by category
 */
export function getNodesGroupedByCategory(): Map<NodeCategory, NodeConfig[]> {
  const grouped = new Map<NodeCategory, NodeConfig[]>();
  
  for (const config of nodeRegistry.getAll()) {
    if (!grouped.has(config.category)) {
      grouped.set(config.category, []);
    }
    grouped.get(config.category)!.push(config);
  }

  return grouped;
}

/**
 * Get a flat list of all node types for the sidebar
 */
export function getNodePaletteItems(): Array<{
  type: string;
  name: string;
  icon: string;
  category: NodeCategory;
  description: string;
}> {
  return nodeRegistry.getAll().map(config => ({
    type: config.type,
    name: config.name,
    icon: config.icon,
    category: config.category,
    description: config.description,
  }));
}

/**
 * Estimate cost for a node execution
 */
export function estimateNodeCost(type: string, input: Record<string, unknown>): number {
  const config = nodeRegistry.get(type);
  if (!config) {
    return 0;
  }

  const { costConfig } = config;
  let cost = costConfig.baseCost;

  // Add variable costs based on input
  if (costConfig.variableCosts) {
    // Token-based costs (for LLMs)
    if (costConfig.variableCosts.perInputToken && typeof input.prompt === "string") {
      // Rough token estimate: 1 token ≈ 4 characters
      const inputTokens = Math.ceil(input.prompt.length / 4);
      cost += inputTokens * costConfig.variableCosts.perInputToken;
    }

    // Duration-based costs (for video/audio)
    if (costConfig.variableCosts.perSecond && typeof input.duration === "number") {
      cost += input.duration * costConfig.variableCosts.perSecond;
    }

    // Size-based costs (for images)
    if (costConfig.variableCosts.perMegapixel && input.width && input.height) {
      const megapixels = ((input.width as number) * (input.height as number)) / 1_000_000;
      cost += megapixels * costConfig.variableCosts.perMegapixel;
    }
  }

  return Math.ceil(cost);
}
