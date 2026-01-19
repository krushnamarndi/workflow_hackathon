/**
 * Node Registry Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NodeRegistry } from "@/lib/nodes/registry";
import type { NodeConfig } from "@/lib/nodes/config-schema";
import { NodeCategory, HandleDataType, HandleDirection } from "@/lib/nodes/config-schema";

// Helper to create a mock node config
function createMockNodeConfig(overrides: Partial<NodeConfig> = {}): NodeConfig {
  return {
    type: "test-node",
    name: "Test Node",
    description: "A test node for unit testing",
    category: NodeCategory.UTILITY,
    icon: "Wrench",
    color: "#888888",
    version: "1.0.0",
    inputs: [
      {
        id: "input1",
        label: "Input 1",
        dataType: HandleDataType.TEXT,
        direction: HandleDirection.INPUT,
        required: true,
      },
    ],
    outputs: [
      {
        id: "output1",
        label: "Output 1",
        dataType: HandleDataType.TEXT,
        direction: HandleDirection.OUTPUT,
        required: true,
      },
    ],
    parameters: [
      {
        id: "param1",
        label: "Parameter 1",
        type: "text",
        required: true,
        hasConnector: false,
        defaultValue: "default",
      },
    ],
    defaultValues: {
      param1: "default",
    },
    costConfig: {
      baseCost: 1000,
    },
    ...overrides,
  };
}

describe("NodeRegistry", () => {
  let registry: NodeRegistry;

  beforeEach(() => {
    registry = new NodeRegistry();
  });

  describe("register", () => {
    it("should register a node config", () => {
      const config = createMockNodeConfig();
      registry.register(config);

      expect(registry.has("test-node")).toBe(true);
    });

    it("should overwrite existing config with same type", () => {
      const config1 = createMockNodeConfig({ name: "First" });
      const config2 = createMockNodeConfig({ name: "Second" });

      registry.register(config1);
      registry.register(config2);

      expect(registry.get("test-node")?.name).toBe("Second");
    });
  });

  describe("get", () => {
    it("should return undefined for non-existent node", () => {
      expect(registry.get("non-existent")).toBeUndefined();
    });

    it("should return registered node config", () => {
      const config = createMockNodeConfig();
      registry.register(config);

      expect(registry.get("test-node")).toEqual(config);
    });
  });

  describe("getAll", () => {
    it("should return empty array when no nodes registered", () => {
      expect(registry.getAll()).toEqual([]);
    });

    it("should return all registered nodes", () => {
      registry.register(createMockNodeConfig({ type: "node1" }));
      registry.register(createMockNodeConfig({ type: "node2" }));

      const all = registry.getAll();
      expect(all).toHaveLength(2);
    });
  });

  describe("getByCategory", () => {
    it("should return empty array for category with no nodes", () => {
      expect(registry.getByCategory(NodeCategory.AI_IMAGE)).toEqual([]);
    });

    it("should return nodes in specified category", () => {
      registry.register(createMockNodeConfig({ 
        type: "image-node", 
        category: NodeCategory.AI_IMAGE 
      }));
      registry.register(createMockNodeConfig({ 
        type: "video-node", 
        category: NodeCategory.AI_VIDEO 
      }));
      registry.register(createMockNodeConfig({ 
        type: "image-node-2", 
        category: NodeCategory.AI_IMAGE 
      }));

      const imageNodes = registry.getByCategory(NodeCategory.AI_IMAGE);
      expect(imageNodes).toHaveLength(2);
      expect(imageNodes.map(n => n.type)).toContain("image-node");
      expect(imageNodes.map(n => n.type)).toContain("image-node-2");
    });
  });

  describe("search", () => {
    beforeEach(() => {
      registry.register(createMockNodeConfig({ 
        type: "seedream", 
        name: "Seedream 4.5",
        description: "AI image generation",
        tags: ["image", "ai", "generation"],
      }));
      registry.register(createMockNodeConfig({ 
        type: "openrouter", 
        name: "OpenRouter LLM",
        description: "Large language model",
        tags: ["llm", "text", "ai"],
      }));
      registry.register(createMockNodeConfig({ 
        type: "crop", 
        name: "Crop Image",
        description: "Crop and resize images",
        tags: ["image", "utility"],
      }));
    });

    it("should return all nodes for empty query", () => {
      expect(registry.search("")).toHaveLength(3);
      expect(registry.search("  ")).toHaveLength(3);
    });

    it("should find nodes by name", () => {
      const results = registry.search("seedream");
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("seedream");
    });

    it("should find nodes by tag", () => {
      const results = registry.search("image");
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.map(n => n.type)).toContain("seedream");
      expect(results.map(n => n.type)).toContain("crop");
    });

    it("should find nodes by description words", () => {
      const results = registry.search("generation");
      expect(results.map(n => n.type)).toContain("seedream");
    });

    it("should be case insensitive", () => {
      const results = registry.search("SEEDREAM");
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("seedream");
    });
  });

  describe("validateInput", () => {
    it("should return error for non-existent node", () => {
      const result = registry.validateInput("non-existent", {});
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should validate input against schema", () => {
      registry.register(createMockNodeConfig({
        parameters: [
          {
            id: "prompt",
            label: "Prompt",
            type: "text",
            required: true,
            hasConnector: false,
            minLength: 1,
          },
        ],
      }));

      const validResult = registry.validateInput("test-node", { prompt: "Hello" });
      expect(validResult.success).toBe(true);
    });
  });

  describe("getDefaultValues", () => {
    it("should return undefined for non-existent node", () => {
      expect(registry.getDefaultValues("non-existent")).toBeUndefined();
    });

    it("should return default values", () => {
      registry.register(createMockNodeConfig({
        defaultValues: {
          param1: "value1",
          param2: 42,
        },
      }));

      const defaults = registry.getDefaultValues("test-node");
      expect(defaults).toEqual({ param1: "value1", param2: 42 });
    });

    it("should return a copy, not the original", () => {
      const config = createMockNodeConfig({
        defaultValues: { param1: "original" },
      });
      registry.register(config);

      const defaults = registry.getDefaultValues("test-node");
      defaults!.param1 = "modified";

      expect(registry.getDefaultValues("test-node")?.param1).toBe("original");
    });
  });

  describe("unregister", () => {
    it("should remove a node config", () => {
      registry.register(createMockNodeConfig());
      expect(registry.has("test-node")).toBe(true);

      const removed = registry.unregister("test-node");
      expect(removed).toBe(true);
      expect(registry.has("test-node")).toBe(false);
    });

    it("should return false for non-existent node", () => {
      expect(registry.unregister("non-existent")).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all nodes", () => {
      registry.register(createMockNodeConfig({ type: "node1" }));
      registry.register(createMockNodeConfig({ type: "node2" }));

      registry.clear();

      expect(registry.getAll()).toHaveLength(0);
    });
  });
});
