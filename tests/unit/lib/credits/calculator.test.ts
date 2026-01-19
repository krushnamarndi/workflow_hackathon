/**
 * Credits Calculator Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
  CREDITS_PER_DOLLAR,
  formatCredits,
  formatCreditsAsUSD,
  usdToCredits,
  creditsToUSD,
  hasInsufficientCredits,
  validateDeduction,
} from "@/lib/credits/calculator";

describe("Credits Calculator", () => {
  describe("constants", () => {
    it("should have correct credits per dollar", () => {
      expect(CREDITS_PER_DOLLAR).toBe(1_000_000n);
    });
  });

  describe("formatCredits", () => {
    it("should format millions correctly", () => {
      expect(formatCredits(1_000_000n)).toBe("1.00M");
      expect(formatCredits(1_500_000n)).toBe("1.50M");
      expect(formatCredits(10_000_000n)).toBe("10.00M");
    });

    it("should format thousands correctly", () => {
      expect(formatCredits(1_000n)).toBe("1.0K");
      expect(formatCredits(50_000n)).toBe("50.0K");
      expect(formatCredits(999_999n)).toBe("1000.0K");
    });

    it("should format small numbers correctly", () => {
      expect(formatCredits(0n)).toBe("0");
      expect(formatCredits(100n)).toBe("100");
      expect(formatCredits(999n)).toBe("999");
    });
  });

  describe("formatCreditsAsUSD", () => {
    it("should convert credits to USD format", () => {
      expect(formatCreditsAsUSD(1_000_000n)).toBe("$1.00");
      expect(formatCreditsAsUSD(500_000n)).toBe("$0.50");
      expect(formatCreditsAsUSD(1_500_000n)).toBe("$1.50");
    });

    it("should handle small amounts", () => {
      expect(formatCreditsAsUSD(1_000n)).toBe("$0.001");
      expect(formatCreditsAsUSD(100n)).toBe("$0.0001");
    });

    it("should handle zero", () => {
      expect(formatCreditsAsUSD(0n)).toBe("$0.00");
    });
  });

  describe("usdToCredits", () => {
    it("should convert dollars to credits", () => {
      expect(usdToCredits(1)).toBe(1_000_000n);
      expect(usdToCredits(0.5)).toBe(500_000n);
      expect(usdToCredits(10)).toBe(10_000_000n);
    });

    it("should handle small amounts", () => {
      expect(usdToCredits(0.01)).toBe(10_000n);
      expect(usdToCredits(0.001)).toBe(1_000n);
    });
  });

  describe("creditsToUSD", () => {
    it("should convert credits to dollars", () => {
      expect(creditsToUSD(1_000_000n)).toBe(1);
      expect(creditsToUSD(500_000n)).toBe(0.5);
      expect(creditsToUSD(10_000_000n)).toBe(10);
    });
  });

  describe("hasInsufficientCredits", () => {
    it("should return true when balance is less than required", () => {
      expect(hasInsufficientCredits(100n, 200n)).toBe(true);
      expect(hasInsufficientCredits(0n, 1n)).toBe(true);
    });

    it("should return false when balance is sufficient", () => {
      expect(hasInsufficientCredits(200n, 100n)).toBe(false);
      expect(hasInsufficientCredits(100n, 100n)).toBe(false);
    });
  });

  describe("validateDeduction", () => {
    it("should allow valid deduction", () => {
      const result = validateDeduction(1000n, 500n);
      expect(result.valid).toBe(true);
      expect(result.newBalance).toBe(500n);
    });

    it("should reject negative deduction amount", () => {
      const result = validateDeduction(1000n, -100n);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("positive");
      expect(result.newBalance).toBe(1000n); // Unchanged
    });

    it("should reject deduction exceeding balance", () => {
      const result = validateDeduction(100n, 200n);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Insufficient");
      expect(result.newBalance).toBe(100n); // Unchanged
    });

    it("should allow deduction equal to balance", () => {
      const result = validateDeduction(100n, 100n);
      expect(result.valid).toBe(true);
      expect(result.newBalance).toBe(0n);
    });
  });
});
