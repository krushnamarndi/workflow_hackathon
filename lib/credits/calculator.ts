/**
 * Credit Calculator
 * 
 * Handles credit estimation, calculation, and validation for workflow executions.
 * Credits are stored as BigInt where 1,000,000 credits = $1.00 USD.
 */

import { nodeRegistry, estimateNodeCost } from "@/lib/nodes/registry";
import type { NodeConfig } from "@/lib/nodes/config-schema";

// ============================================================================
// Constants
// ============================================================================

/**
 * Credits per dollar (1M credits = $1)
 */
export const CREDITS_PER_DOLLAR = 1_000_000n;

/**
 * Minimum credit balance required to start execution
 */
export const MIN_EXECUTION_BALANCE = 1_000n; // 0.001 credits

// ============================================================================
// Types
// ============================================================================

/**
 * Node execution cost breakdown
 */
export interface NodeCostBreakdown {
  nodeId: string;
  nodeType: string;
  nodeName: string;
  estimatedCost: bigint;
  actualCost?: bigint;
}

/**
 * Workflow execution cost estimate
 */
export interface WorkflowCostEstimate {
  totalEstimated: bigint;
  breakdown: NodeCostBreakdown[];
  canExecute: boolean;
  insufficientBy?: bigint;
}

/**
 * Credit transaction record
 */
export interface CreditTransactionInput {
  userId: string;
  amount: bigint;
  type: "execution" | "topup" | "refund" | "adjustment" | "bonus";
  description: string;
  executionId?: string;
  nodeId?: string;
  provider?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Cost Calculation Functions
// ============================================================================

/**
 * Estimate the cost for executing a single node
 * 
 * @param nodeType - The type of node
 * @param nodeId - The node ID
 * @param input - The node input parameters
 * @returns Cost breakdown for the node
 */
export function estimateSingleNodeCost(
  nodeType: string,
  nodeId: string,
  input: Record<string, unknown>
): NodeCostBreakdown {
  const config = nodeRegistry.get(nodeType);
  const cost = estimateNodeCost(nodeType, input);

  return {
    nodeId,
    nodeType,
    nodeName: config?.name || nodeType,
    estimatedCost: BigInt(cost),
  };
}

/**
 * Estimate the total cost for executing a workflow
 * 
 * @param nodes - Array of nodes to execute
 * @param userBalance - Current user credit balance
 * @returns Workflow cost estimate with execution permission
 */
export function estimateWorkflowCost(
  nodes: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
  }>,
  userBalance: bigint
): WorkflowCostEstimate {
  const breakdown: NodeCostBreakdown[] = [];
  let totalEstimated = 0n;

  for (const node of nodes) {
    const nodeCost = estimateSingleNodeCost(node.type, node.id, node.data);
    breakdown.push(nodeCost);
    totalEstimated += nodeCost.estimatedCost;
  }

  const canExecute = userBalance >= totalEstimated;
  const insufficientBy = canExecute ? undefined : totalEstimated - userBalance;

  return {
    totalEstimated,
    breakdown,
    canExecute,
    insufficientBy,
  };
}

/**
 * Calculate actual cost after execution
 * 
 * @param nodeType - The type of node
 * @param metrics - Execution metrics (tokens, duration, etc.)
 * @returns Actual cost in credits
 */
export function calculateActualCost(
  nodeType: string,
  metrics: {
    inputTokens?: number;
    outputTokens?: number;
    durationSeconds?: number;
    outputMegapixels?: number;
  }
): bigint {
  const config = nodeRegistry.get(nodeType);
  if (!config) {
    return 0n;
  }

  const { costConfig } = config;
  let cost = BigInt(costConfig.baseCost);

  if (costConfig.variableCosts) {
    if (costConfig.variableCosts.perInputToken && metrics.inputTokens) {
      cost += BigInt(Math.ceil(metrics.inputTokens * costConfig.variableCosts.perInputToken));
    }

    if (costConfig.variableCosts.perOutputToken && metrics.outputTokens) {
      cost += BigInt(Math.ceil(metrics.outputTokens * costConfig.variableCosts.perOutputToken));
    }

    if (costConfig.variableCosts.perSecond && metrics.durationSeconds) {
      cost += BigInt(Math.ceil(metrics.durationSeconds * costConfig.variableCosts.perSecond));
    }

    if (costConfig.variableCosts.perMegapixel && metrics.outputMegapixels) {
      cost += BigInt(Math.ceil(metrics.outputMegapixels * costConfig.variableCosts.perMegapixel));
    }
  }

  return cost;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if user has sufficient credits for an operation
 * 
 * @param userBalance - Current user balance
 * @param requiredCredits - Credits required
 * @returns Whether user can proceed
 */
export function hasInsufficientCredits(
  userBalance: bigint,
  requiredCredits: bigint
): boolean {
  return userBalance < requiredCredits;
}

/**
 * Validate that a deduction won't result in negative balance
 * 
 * @param currentBalance - Current balance
 * @param deductionAmount - Amount to deduct
 * @returns Validation result
 */
export function validateDeduction(
  currentBalance: bigint,
  deductionAmount: bigint
): { valid: boolean; newBalance: bigint; error?: string } {
  if (deductionAmount < 0n) {
    return {
      valid: false,
      newBalance: currentBalance,
      error: "Deduction amount must be positive",
    };
  }

  const newBalance = currentBalance - deductionAmount;
  
  if (newBalance < 0n) {
    return {
      valid: false,
      newBalance: currentBalance,
      error: `Insufficient credits. Need ${deductionAmount}, have ${currentBalance}`,
    };
  }

  return { valid: true, newBalance };
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format credits for display
 * 
 * @param credits - Credit amount
 * @returns Formatted string (e.g., "1.50M" or "500K")
 */
export function formatCredits(credits: bigint): string {
  const num = Number(credits);
  
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  
  return num.toString();
}

/**
 * Format credits as USD
 * 
 * @param credits - Credit amount
 * @returns Formatted USD string (e.g., "$1.50")
 */
export function formatCreditsAsUSD(credits: bigint): string {
  const dollars = Number(credits) / Number(CREDITS_PER_DOLLAR);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(dollars);
}

/**
 * Convert USD to credits
 * 
 * @param dollars - Dollar amount
 * @returns Credit amount
 */
export function usdToCredits(dollars: number): bigint {
  return BigInt(Math.round(dollars * Number(CREDITS_PER_DOLLAR)));
}

/**
 * Convert credits to USD
 * 
 * @param credits - Credit amount
 * @returns Dollar amount
 */
export function creditsToUSD(credits: bigint): number {
  return Number(credits) / Number(CREDITS_PER_DOLLAR);
}

// ============================================================================
// Default Cost Configurations
// ============================================================================

/**
 * Default cost configurations for node types
 * These are used when node configs don't specify their own costs
 */
export const DEFAULT_NODE_COSTS: Record<string, NodeConfig["costConfig"]> = {
  // AI Image Generation
  "seedream-4.5": {
    baseCost: 50000, // $0.05 per image
    variableCosts: {
      perMegapixel: 10000, // Additional $0.01 per megapixel
    },
  },
  
  // AI Video Generation
  "seedance-1.5": {
    baseCost: 200000, // $0.20 base
    variableCosts: {
      perSecond: 50000, // $0.05 per second
    },
  },
  
  // Audio Generation
  "elevenlabs-v3": {
    baseCost: 10000, // $0.01 base
    variableCosts: {
      perSecond: 5000, // $0.005 per second
    },
  },
  
  // LLM
  "openrouter-llm": {
    baseCost: 1000, // $0.001 base
    variableCosts: {
      perInputToken: 1, // $0.000001 per input token
      perOutputToken: 3, // $0.000003 per output token
    },
  },
  
  // Video Processing
  "kling-o1": {
    baseCost: 300000, // $0.30 base
    variableCosts: {
      perSecond: 100000, // $0.10 per second
    },
  },
  
  // Lipsync
  "sync-lipsync": {
    baseCost: 150000, // $0.15 base
    variableCosts: {
      perSecond: 30000, // $0.03 per second
    },
  },
  
  // Utility nodes (internal, no provider cost)
  "crop-image": {
    baseCost: 1000, // $0.001 (compute only)
  },
  "merge-audio-video": {
    baseCost: 2000, // $0.002 (compute only)
  },
  "merge-videos": {
    baseCost: 3000, // $0.003 (compute only)
  },
  "extract-audio": {
    baseCost: 1000, // $0.001 (compute only)
  },
};
