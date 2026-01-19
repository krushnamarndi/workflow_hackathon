/**
 * Provider Abstraction Layer
 * 
 * This module defines the core interfaces for the provider abstraction system.
 * Each AI provider (fal.ai, OpenRouter, etc.) implements these interfaces,
 * allowing the execution engine to be provider-agnostic.
 * 
 * Key concepts:
 * - IProvider: Base interface all providers must implement
 * - ProviderConfig: Configuration for provider instances
 * - FallbackChain: Ordered list of providers to try
 * - ProviderResult: Standardized result wrapper
 */

import { z } from "zod";

// ============================================================================
// Provider Status & Results
// ============================================================================

/**
 * Status of a provider execution attempt
 */
export type ProviderStatus = "pending" | "running" | "completed" | "failed" | "timeout";

/**
 * Result wrapper for provider executions
 * Captures both success and failure states with metadata
 */
export interface ProviderResult<TOutput> {
  /** Whether the execution succeeded */
  success: boolean;
  /** The output data if successful */
  data?: TOutput;
  /** Error information if failed */
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  /** Provider that handled this request */
  provider: string;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Estimated cost in credits (1M credits = $1) */
  creditsUsed: number;
}

// ============================================================================
// Provider Configuration
// ============================================================================

/**
 * Configuration for a provider instance
 */
export interface ProviderConfig {
  /** Unique provider identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Base URL for API requests */
  baseUrl: string;
  /** API key environment variable name */
  apiKeyEnvVar: string;
  /** Default timeout in milliseconds */
  defaultTimeoutMs: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Whether provider supports webhooks */
  supportsWebhooks: boolean;
  /** Rate limit (requests per minute) */
  rateLimitRpm?: number;
}

/**
 * Fallback chain configuration
 * Providers are tried in order until one succeeds
 */
export interface FallbackChainConfig {
  /** Ordered list of provider IDs to try */
  providers: string[];
  /** Strategy for selecting provider */
  strategy: "sequential" | "random" | "round-robin";
  /** Maximum time to wait for all providers (ms) */
  globalTimeoutMs: number;
}

// ============================================================================
// Provider Interface
// ============================================================================

/**
 * Base interface for all AI providers
 * 
 * @typeParam TInput - Zod-validated input schema type
 * @typeParam TOutput - Zod-validated output schema type
 * 
 * @example
 * ```typescript
 * class FalSeedreamProvider implements IProvider<SeedreamInput, SeedreamOutput> {
 *   async execute(input: SeedreamInput): Promise<ProviderResult<SeedreamOutput>> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export interface IProvider<TInput, TOutput> {
  /** Provider configuration */
  readonly config: ProviderConfig;
  
  /** Zod schema for validating inputs */
  readonly inputSchema: z.ZodType<TInput>;
  
  /** Zod schema for validating outputs */
  readonly outputSchema: z.ZodType<TOutput>;

  /**
   * Execute a request against this provider
   * 
   * @param input - Validated input data
   * @param options - Execution options
   * @returns Promise resolving to provider result
   */
  execute(
    input: TInput,
    options?: ProviderExecuteOptions
  ): Promise<ProviderResult<TOutput>>;

  /**
   * Validate input before execution
   * 
   * @param input - Raw input data
   * @returns Validated input or throws validation error
   */
  validateInput(input: unknown): TInput;

  /**
   * Estimate credit cost for a given input
   * 
   * @param input - Validated input data
   * @returns Estimated credits (1M credits = $1)
   */
  estimateCost(input: TInput): number;

  /**
   * Check if provider is available (rate limits, health)
   * 
   * @returns True if provider can accept requests
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Options for provider execution
 */
export interface ProviderExecuteOptions {
  /** Override default timeout (ms) */
  timeoutMs?: number;
  /** Webhook URL for async results (if supported) */
  webhookUrl?: string;
  /** Request ID for tracking */
  requestId?: string;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

// ============================================================================
// Provider with Webhook Support
// ============================================================================

/**
 * Extended interface for providers that support webhook-based async execution
 * Used with Trigger.dev wait.forToken() pattern
 */
export interface IWebhookProvider<TInput, TOutput> extends IProvider<TInput, TOutput> {
  /**
   * Submit a request for async execution
   * Returns immediately with a request ID
   * 
   * @param input - Validated input data
   * @param webhookUrl - URL to receive results
   * @returns Request ID for tracking
   */
  submit(
    input: TInput,
    webhookUrl: string
  ): Promise<{ requestId: string }>;

  /**
   * Parse webhook payload into output type
   * 
   * @param payload - Raw webhook payload
   * @returns Validated output data
   */
  parseWebhookPayload(payload: unknown): TOutput;
}

// ============================================================================
// Provider Registry Types
// ============================================================================

/**
 * Node type to provider mapping
 */
export interface NodeProviderMapping {
  /** Node type identifier */
  nodeType: string;
  /** Primary provider ID */
  primaryProvider: string;
  /** Fallback providers in order */
  fallbackProviders: string[];
}

/**
 * Provider registry interface
 */
export interface IProviderRegistry {
  /**
   * Register a provider implementation
   */
  register<TInput, TOutput>(
    provider: IProvider<TInput, TOutput>
  ): void;

  /**
   * Get provider by ID
   */
  get<TInput, TOutput>(
    providerId: string
  ): IProvider<TInput, TOutput> | undefined;

  /**
   * Get all providers for a node type
   */
  getProvidersForNode(nodeType: string): string[];

  /**
   * Execute with fallback chain
   */
  executeWithFallback<TInput, TOutput>(
    nodeType: string,
    input: TInput,
    options?: ProviderExecuteOptions
  ): Promise<ProviderResult<TOutput>>;
}

// ============================================================================
// Credit Calculation Types
// ============================================================================

/**
 * Cost calculation parameters per provider/operation
 */
export interface CostCalculation {
  /** Base cost in credits */
  baseCost: number;
  /** Cost per input token (for LLMs) */
  inputTokenCost?: number;
  /** Cost per output token (for LLMs) */
  outputTokenCost?: number;
  /** Cost per second of media (for video/audio) */
  mediaSecondCost?: number;
  /** Cost per megapixel (for images) */
  megapixelCost?: number;
}

/**
 * Provider usage metrics for billing
 */
export interface ProviderUsageMetrics {
  /** Provider ID */
  providerId: string;
  /** Number of requests */
  requestCount: number;
  /** Total credits used */
  totalCredits: number;
  /** Total duration (ms) */
  totalDurationMs: number;
  /** Success rate (0-1) */
  successRate: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Provider-specific error codes
 */
export const ProviderErrorCodes = {
  RATE_LIMITED: "RATE_LIMITED",
  TIMEOUT: "TIMEOUT",
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_OUTPUT: "INVALID_OUTPUT",
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
  CONTENT_MODERATION: "CONTENT_MODERATION",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ProviderErrorCode = typeof ProviderErrorCodes[keyof typeof ProviderErrorCodes];

/**
 * Structured provider error
 */
export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly providerId: string,
    public readonly retryable: boolean = false,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
