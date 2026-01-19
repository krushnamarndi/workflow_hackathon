/**
 * Provider Registry Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProviderRegistry } from "@/lib/providers/registry";
import type { IProvider, ProviderConfig, ProviderResult } from "@/lib/providers/types";
import { z } from "zod";

// Mock provider for testing
function createMockProvider(
  id: string,
  shouldSucceed: boolean = true,
  isAvailable: boolean = true
): IProvider<{ prompt: string }, { result: string }> {
  return {
    config: {
      id,
      name: `Mock ${id}`,
      baseUrl: "https://mock.api",
      apiKeyEnvVar: "MOCK_API_KEY",
      defaultTimeoutMs: 30000,
      maxRetries: 3,
      supportsWebhooks: false,
    } as ProviderConfig,
    inputSchema: z.object({ prompt: z.string() }),
    outputSchema: z.object({ result: z.string() }),
    execute: vi.fn().mockResolvedValue({
      success: shouldSucceed,
      data: shouldSucceed ? { result: `Response from ${id}` } : undefined,
      error: shouldSucceed ? undefined : { code: "ERROR", message: "Failed", retryable: true },
      provider: id,
      durationMs: 100,
      creditsUsed: 1000,
    } as ProviderResult<{ result: string }>),
    validateInput: vi.fn().mockImplementation((input) => input),
    estimateCost: vi.fn().mockReturnValue(1000),
    isAvailable: vi.fn().mockResolvedValue(isAvailable),
  };
}

describe("ProviderRegistry", () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
  });

  describe("register", () => {
    it("should register a provider", () => {
      const provider = createMockProvider("test-provider");
      registry.register(provider);
      
      expect(registry.has("test-provider")).toBe(true);
    });

    it("should overwrite existing provider with same id", () => {
      const provider1 = createMockProvider("test-provider");
      const provider2 = createMockProvider("test-provider");
      
      registry.register(provider1);
      registry.register(provider2);
      
      expect(registry.has("test-provider")).toBe(true);
      expect(registry.get("test-provider")).toBe(provider2);
    });
  });

  describe("get", () => {
    it("should return undefined for non-existent provider", () => {
      expect(registry.get("non-existent")).toBeUndefined();
    });

    it("should return registered provider", () => {
      const provider = createMockProvider("test-provider");
      registry.register(provider);
      
      expect(registry.get("test-provider")).toBe(provider);
    });
  });

  describe("setNodeMapping", () => {
    it("should map node types to providers", () => {
      registry.setNodeMapping({
        nodeType: "image-gen",
        primaryProvider: "fal-seedream",
        fallbackProviders: ["replicate-sdxl"],
      });

      const providers = registry.getProvidersForNode("image-gen");
      expect(providers).toEqual(["fal-seedream", "replicate-sdxl"]);
    });

    it("should return empty array for unmapped node type", () => {
      const providers = registry.getProvidersForNode("unknown");
      expect(providers).toEqual([]);
    });
  });

  describe("executeWithFallback", () => {
    it("should execute with primary provider when available", async () => {
      const primaryProvider = createMockProvider("primary", true, true);
      const fallbackProvider = createMockProvider("fallback", true, true);

      registry.register(primaryProvider);
      registry.register(fallbackProvider);
      registry.setNodeMapping({
        nodeType: "test-node",
        primaryProvider: "primary",
        fallbackProviders: ["fallback"],
      });

      const result = await registry.executeWithFallback("test-node", { prompt: "test" });

      expect(result.success).toBe(true);
      expect(result.provider).toBe("primary");
      expect(primaryProvider.execute).toHaveBeenCalled();
      expect(fallbackProvider.execute).not.toHaveBeenCalled();
    });

    it("should fallback to next provider when primary fails", async () => {
      const primaryProvider = createMockProvider("primary", false, true);
      const fallbackProvider = createMockProvider("fallback", true, true);

      registry.register(primaryProvider);
      registry.register(fallbackProvider);
      registry.setNodeMapping({
        nodeType: "test-node",
        primaryProvider: "primary",
        fallbackProviders: ["fallback"],
      });

      const result = await registry.executeWithFallback("test-node", { prompt: "test" });

      expect(result.success).toBe(true);
      expect(result.provider).toBe("fallback");
    });

    it("should skip unavailable providers", async () => {
      const unavailableProvider = createMockProvider("unavailable", true, false);
      const availableProvider = createMockProvider("available", true, true);

      registry.register(unavailableProvider);
      registry.register(availableProvider);
      registry.setNodeMapping({
        nodeType: "test-node",
        primaryProvider: "unavailable",
        fallbackProviders: ["available"],
      });

      const result = await registry.executeWithFallback("test-node", { prompt: "test" });

      expect(result.success).toBe(true);
      expect(result.provider).toBe("available");
      expect(unavailableProvider.execute).not.toHaveBeenCalled();
    });

    it("should throw error when no providers configured for node", async () => {
      await expect(
        registry.executeWithFallback("unknown-node", { prompt: "test" })
      ).rejects.toThrow('No providers configured for node type "unknown-node"');
    });

    it("should return failure when all providers fail", async () => {
      const provider1 = createMockProvider("provider1", false, true);
      const provider2 = createMockProvider("provider2", false, true);

      registry.register(provider1);
      registry.register(provider2);
      registry.setNodeMapping({
        nodeType: "test-node",
        primaryProvider: "provider1",
        fallbackProviders: ["provider2"],
      });

      const result = await registry.executeWithFallback("test-node", { prompt: "test" });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("All providers failed");
    });
  });

  describe("getAllProviders", () => {
    it("should return all registered providers", () => {
      registry.register(createMockProvider("provider1"));
      registry.register(createMockProvider("provider2"));

      const providers = registry.getAllProviders();
      
      expect(providers).toHaveLength(2);
      expect(providers.map(p => p.id)).toContain("provider1");
      expect(providers.map(p => p.id)).toContain("provider2");
    });
  });

  describe("clear", () => {
    it("should remove all providers and mappings", () => {
      registry.register(createMockProvider("provider1"));
      registry.setNodeMapping({
        nodeType: "test",
        primaryProvider: "provider1",
        fallbackProviders: [],
      });

      registry.clear();

      expect(registry.has("provider1")).toBe(false);
      expect(registry.getProvidersForNode("test")).toEqual([]);
    });
  });
});
