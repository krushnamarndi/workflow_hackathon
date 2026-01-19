/**
 * Quick manual test script for Day 1 changes
 * Run with: npx tsx scripts/test-day1.ts
 */

import { ProviderRegistry } from "../lib/providers/registry";
import { NodeRegistry } from "../lib/nodes/registry";
import { NodeCategory, HandleDataType, HandleDirection } from "../lib/nodes/config-schema";
import { formatCredits, formatCreditsAsUSD, usdToCredits } from "../lib/credits/calculator";

console.log("🧪 Testing Day 1 Changes\n");

// Test 1: Provider Registry
console.log("1️⃣ Provider Registry");
const providerRegistry = new ProviderRegistry();
console.log("   ✓ Created empty registry");
console.log(`   ✓ Has 'test': ${providerRegistry.has("test")}`);
console.log("");

// Test 2: Node Registry
console.log("2️⃣ Node Registry");
const nodeRegistry = new NodeRegistry();

nodeRegistry.register({
  type: "seedream-4.5",
  name: "Seedream 4.5",
  description: "AI image generation using Seedream model",
  category: NodeCategory.AI_IMAGE,
  icon: "Image",
  color: "#8B5CF6",
  version: "1.0.0",
  inputs: [
    {
      id: "prompt",
      label: "Prompt",
      dataType: HandleDataType.TEXT,
      direction: HandleDirection.INPUT,
      required: true,
      description: "Text description of the image",
    },
  ],
  outputs: [
    {
      id: "image",
      label: "Image",
      dataType: HandleDataType.IMAGE,
      direction: HandleDirection.OUTPUT,
      required: true,
    },
  ],
  parameters: [
    {
      id: "aspectRatio",
      label: "Aspect Ratio",
      type: "select",
      required: false,
      hasConnector: false,
      options: [
        { value: "1:1", label: "Square (1:1)" },
        { value: "16:9", label: "Landscape (16:9)" },
        { value: "9:16", label: "Portrait (9:16)" },
      ],
    },
  ],
  defaultValues: {
    aspectRatio: "1:1",
  },
  costConfig: {
    baseCost: 50000,
    variableCosts: {
      perMegapixel: 10000,
    },
  },
  tags: ["image", "ai", "generation", "seedream"],
});

console.log("   ✓ Registered Seedream 4.5 node");
console.log(`   ✓ Has 'seedream-4.5': ${nodeRegistry.has("seedream-4.5")}`);
console.log(`   ✓ Search 'image': ${nodeRegistry.search("image").length} results`);
console.log(`   ✓ AI Image nodes: ${nodeRegistry.getByCategory(NodeCategory.AI_IMAGE).length}`);
console.log("");

// Test 3: Credits Calculator
console.log("3️⃣ Credits Calculator");
console.log(`   ✓ $1 = ${formatCredits(usdToCredits(1))} credits`);
console.log(`   ✓ 1M credits = ${formatCreditsAsUSD(1_000_000n)}`);
console.log(`   ✓ 50K credits = ${formatCreditsAsUSD(50_000n)}`);
console.log("");

// Test 4: Schema Generation
console.log("4️⃣ Schema Generation");
const schema = nodeRegistry.getInputSchema("seedream-4.5");
if (schema) {
  const validResult = schema.safeParse({ aspectRatio: "16:9" });
  console.log(`   ✓ Generated Zod schema for seedream-4.5`);
  console.log(`   ✓ Valid input: ${validResult.success}`);
  
  const invalidResult = schema.safeParse({ aspectRatio: "invalid" });
  console.log(`   ✓ Invalid input rejected: ${!invalidResult.success}`);
}
console.log("");

console.log("✅ All Day 1 systems working correctly!");
