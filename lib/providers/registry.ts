/**
 * Provider Registry
 * 
 * Central registry for all provider implementations.
 * Handles provider registration, lookup, and fallback chain execution.
 */

import {
  IProvider,
  IProviderRegistry,
  ProviderResult,
  ProviderExecuteOptions,
  ProviderError,
  ProviderErrorCodes,
  ProviderErrorCode,
  NodeProviderMapping,
} from "./types";

/**
 * Provider Registry Implementation
 * 
 * Manages provider instances and handles fallback chain execution.
 * 
 * @example
 * ```typescript
 * const registry = new ProviderRegistry();
 * registry.register(new FalSeedreamProvider());
 * registry.setNodeMapping({
 *   nodeType: "seedream",
 *   primaryProvider: "fal-seedream",
 *   fallbackProviders: ["fal-seedream-backup"],
 * });
 * 
 * const result = await registry.executeWithFallback("seedream", input);
 * ```
 */
export class ProviderRegistry implements IProviderRegistry {
  private providers = new Map<string, IProvider<unknown, unknown>>();
  private nodeMappings = new Map<string, NodeProviderMapping>();

  /**
   * Register a provider implementation
   */
  register<TInput, TOutput>(provider: IProvider<TInput, TOutput>): void {
    const id = provider.config.id;
    
    if (this.providers.has(id)) {
      console.warn(`Provider "${id}" is already registered. Overwriting.`);
    }
    
    this.providers.set(id, provider as IProvider<unknown, unknown>);
  }

  /**
   * Get a provider by ID
   */
  get<TInput, TOutput>(providerId: string): IProvider<TInput, TOutput> | undefined {
    return this.providers.get(providerId) as IProvider<TInput, TOutput> | undefined;
  }

  /**
   * Set node-to-provider mapping
   */
  setNodeMapping(mapping: NodeProviderMapping): void {
    this.nodeMappings.set(mapping.nodeType, mapping);
  }

  /**
   * Get all provider IDs for a node type
   */
  getProvidersForNode(nodeType: string): string[] {
    const mapping = this.nodeMappings.get(nodeType);
    if (!mapping) {
      return [];
    }
    return [mapping.primaryProvider, ...mapping.fallbackProviders];
  }

  /**
   * Execute with fallback chain
   * 
   * Tries providers in order until one succeeds.
   * Returns the result from the first successful provider.
   */
  async executeWithFallback<TInput, TOutput>(
    nodeType: string,
    input: TInput,
    options?: ProviderExecuteOptions
  ): Promise<ProviderResult<TOutput>> {
    const providerIds = this.getProvidersForNode(nodeType);
    
    if (providerIds.length === 0) {
      throw new ProviderError(
        ProviderErrorCodes.PROVIDER_UNAVAILABLE,
        `No providers configured for node type "${nodeType}"`,
        "registry",
        false
      );
    }

    const errors: Array<{ providerId: string; error: Error }> = [];
    const startTime = Date.now();

    for (const providerId of providerIds) {
      const provider = this.get<TInput, TOutput>(providerId);
      
      if (!provider) {
        console.warn(`Provider "${providerId}" not found in registry`);
        continue;
      }

      try {
        // Check if provider is available
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.warn(`Provider "${providerId}" is not available, trying next`);
          continue;
        }

        // Validate input
        const validatedInput = provider.validateInput(input);

        // Execute
        const result = await provider.execute(validatedInput, options);

        if (result.success) {
          return result;
        }

        // If not retryable, throw immediately
        if (result.error && !result.error.retryable) {
          throw new ProviderError(
            result.error.code as ProviderErrorCode,
            result.error.message,
            providerId,
            false
          );
        }

        // Record error and try next provider
        errors.push({
          providerId,
          error: new Error(result.error?.message || "Unknown error"),
        });
      } catch (error) {
        const providerError = error instanceof ProviderError
          ? error
          : new ProviderError(
              ProviderErrorCodes.UNKNOWN_ERROR,
              error instanceof Error ? error.message : "Unknown error",
              providerId,
              true,
              error instanceof Error ? error : undefined
            );

        // If error is not retryable, throw immediately
        if (!providerError.retryable) {
          throw providerError;
        }

        errors.push({ providerId, error: providerError });
        console.warn(`Provider "${providerId}" failed:`, providerError.message);
      }
    }

    // All providers failed
    const totalDuration = Date.now() - startTime;
    const errorMessages = errors.map(e => `${e.providerId}: ${e.error.message}`).join("; ");

    return {
      success: false,
      error: {
        code: ProviderErrorCodes.PROVIDER_UNAVAILABLE,
        message: `All providers failed: ${errorMessages}`,
        retryable: false,
      },
      provider: errors[0]?.providerId || "unknown",
      durationMs: totalDuration,
      creditsUsed: 0,
    };
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): Array<{ id: string; name: string }> {
    return Array.from(this.providers.values()).map(p => ({
      id: p.config.id,
      name: p.config.name,
    }));
  }

  /**
   * Get all node mappings
   */
  getAllNodeMappings(): NodeProviderMapping[] {
    return Array.from(this.nodeMappings.values());
  }

  /**
   * Check if a provider is registered
   */
  has(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /**
   * Remove a provider
   */
  unregister(providerId: string): boolean {
    return this.providers.delete(providerId);
  }

  /**
   * Clear all providers and mappings
   */
  clear(): void {
    this.providers.clear();
    this.nodeMappings.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global provider registry instance
 */
export const providerRegistry = new ProviderRegistry();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Execute a node with the registered provider
 * 
 * @param nodeType - The type of node to execute
 * @param input - The input data
 * @param options - Execution options
 * @returns Provider result
 */
export async function executeNode<TInput, TOutput>(
  nodeType: string,
  input: TInput,
  options?: ProviderExecuteOptions
): Promise<ProviderResult<TOutput>> {
  return providerRegistry.executeWithFallback<TInput, TOutput>(
    nodeType,
    input,
    options
  );
}

/**
 * Estimate cost for a node execution
 * 
 * @param nodeType - The type of node
 * @param input - The input data
 * @returns Estimated cost in credits
 */
export function estimateNodeCost<TInput>(
  nodeType: string,
  input: TInput
): number {
  const providerIds = providerRegistry.getProvidersForNode(nodeType);
  
  if (providerIds.length === 0) {
    return 0;
  }

  // Use primary provider for estimation
  const provider = providerRegistry.get<TInput, unknown>(providerIds[0]);
  
  if (!provider) {
    return 0;
  }

  try {
    const validatedInput = provider.validateInput(input);
    return provider.estimateCost(validatedInput);
  } catch {
    return 0;
  }
}
