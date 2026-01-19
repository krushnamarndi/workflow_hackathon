/**
 * Credit Ledger
 * 
 * Manages credit transactions with atomic balance updates.
 * All credit operations go through this module to ensure consistency.
 */

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { CreditTransactionInput } from "./calculator";

// ============================================================================
// Types
// ============================================================================

export interface LedgerEntry {
  id: string;
  userId: string;
  amount: bigint;
  balance: bigint;
  type: string;
  description: string;
  executionId?: string | null;
  nodeId?: string | null;
  provider?: string | null;
  createdAt: Date;
}

export interface DeductionResult {
  success: boolean;
  transactionId?: string;
  newBalance?: bigint;
  error?: string;
}

export interface TopupResult {
  success: boolean;
  transactionId?: string;
  newBalance?: bigint;
  error?: string;
}

// ============================================================================
// Core Ledger Operations
// ============================================================================

/**
 * Get user's current credit balance
 * 
 * @param userId - The user's ID
 * @returns Current balance or 0 if user not found
 */
export async function getBalance(userId: string): Promise<bigint> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  return user?.credits ?? 0n;
}

/**
 * Deduct credits for a workflow execution
 * 
 * Uses a transaction to ensure atomicity.
 * Fails if user has insufficient balance.
 * 
 * @param input - Transaction details
 * @returns Deduction result
 */
export async function deductCredits(
  input: CreditTransactionInput
): Promise<DeductionResult> {
  const { userId, amount, type, description, executionId, nodeId, provider, metadata } = input;

  // Ensure amount is negative for deductions
  const deductionAmount = amount > 0n ? -amount : amount;

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get current balance with lock
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const currentBalance = user.credits;
      const absoluteAmount = deductionAmount < 0n ? -deductionAmount : deductionAmount;

      if (currentBalance < absoluteAmount) {
        throw new Error(
          `Insufficient credits. Required: ${absoluteAmount}, Available: ${currentBalance}`
        );
      }

      const newBalance = currentBalance + deductionAmount;

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: { credits: newBalance },
      });

      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount: deductionAmount,
          balance: newBalance,
          type,
          description,
          executionId,
          nodeId,
          provider,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      });

      return { transactionId: transaction.id, newBalance };
    });

    return {
      success: true,
      transactionId: result.transactionId,
      newBalance: result.newBalance,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add credits to user account (topup, refund, bonus)
 * 
 * @param input - Transaction details
 * @returns Topup result
 */
export async function addCredits(
  input: CreditTransactionInput
): Promise<TopupResult> {
  const { userId, amount, type, description, executionId, nodeId, provider, metadata } = input;

  // Ensure amount is positive for additions
  const additionAmount = amount < 0n ? -amount : amount;

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const newBalance = user.credits + additionAmount;

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: { credits: newBalance },
      });

      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount: additionAmount,
          balance: newBalance,
          type,
          description,
          executionId,
          nodeId,
          provider,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      });

      return { transactionId: transaction.id, newBalance };
    });

    return {
      success: true,
      transactionId: result.transactionId,
      newBalance: result.newBalance,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Reserve credits before execution (soft hold)
 * 
 * Creates a pending transaction that will be confirmed or released.
 * This is used to prevent overdrafts during long-running executions.
 * 
 * @param userId - The user's ID
 * @param amount - Amount to reserve
 * @param executionId - Associated execution ID
 * @returns Reservation result with transaction ID
 */
export async function reserveCredits(
  userId: string,
  amount: bigint,
  executionId: string
): Promise<DeductionResult> {
  return deductCredits({
    userId,
    amount,
    type: "execution",
    description: `Reserved for execution ${executionId}`,
    executionId,
  });
}

/**
 * Refund credits (partial or full)
 * 
 * Used when:
 * - Execution fails and user should get credits back
 * - Estimated cost was higher than actual cost
 * 
 * @param userId - The user's ID
 * @param amount - Amount to refund
 * @param executionId - Associated execution ID
 * @param reason - Reason for refund
 * @returns Refund result
 */
export async function refundCredits(
  userId: string,
  amount: bigint,
  executionId: string,
  reason: string
): Promise<TopupResult> {
  return addCredits({
    userId,
    amount,
    type: "refund",
    description: `Refund: ${reason}`,
    executionId,
  });
}

// ============================================================================
// Transaction History
// ============================================================================

/**
 * Get transaction history for a user
 * 
 * @param userId - The user's ID
 * @param options - Pagination and filter options
 * @returns Array of ledger entries
 */
export async function getTransactionHistory(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<LedgerEntry[]> {
  const { limit = 50, offset = 0, type, startDate, endDate } = options || {};

  const where: Record<string, unknown> = { userId };

  if (type) {
    where.type = type;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      (where.createdAt as Record<string, Date>).gte = startDate;
    }
    if (endDate) {
      (where.createdAt as Record<string, Date>).lte = endDate;
    }
  }

  const transactions = await prisma.creditTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return transactions.map(tx => ({
    id: tx.id,
    userId: tx.userId,
    amount: tx.amount,
    balance: tx.balance,
    type: tx.type,
    description: tx.description,
    executionId: tx.executionId,
    nodeId: tx.nodeId,
    provider: tx.provider,
    createdAt: tx.createdAt,
  }));
}

/**
 * Get transactions for a specific execution
 * 
 * @param executionId - The execution ID
 * @returns Array of ledger entries
 */
export async function getExecutionTransactions(
  executionId: string
): Promise<LedgerEntry[]> {
  const transactions = await prisma.creditTransaction.findMany({
    where: { executionId },
    orderBy: { createdAt: "asc" },
  });

  return transactions.map(tx => ({
    id: tx.id,
    userId: tx.userId,
    amount: tx.amount,
    balance: tx.balance,
    type: tx.type,
    description: tx.description,
    executionId: tx.executionId,
    nodeId: tx.nodeId,
    provider: tx.provider,
    createdAt: tx.createdAt,
  }));
}

/**
 * Get total credits used in a time period
 * 
 * @param userId - The user's ID
 * @param startDate - Start of period
 * @param endDate - End of period
 * @returns Total credits used (as positive number)
 */
export async function getCreditsUsedInPeriod(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<bigint> {
  const result = await prisma.creditTransaction.aggregate({
    where: {
      userId,
      type: "execution",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Amount is negative for executions, so negate to get positive total
  const sum = result._sum.amount ?? 0n;
  return sum < 0n ? -sum : sum;
}
