/**
 * Vitest global setup file
 * 
 * This file is loaded before each test file.
 * Configure global mocks, extend matchers, and setup MSW here.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import { server } from "./mocks/server";

// ============================================================================
// MSW Server Setup
// ============================================================================

beforeAll(() => {
  // Start MSW server before all tests
  server.listen({ onUnhandledRequest: "warn" });
});

afterEach(() => {
  // Reset MSW handlers between tests
  server.resetHandlers();
  // Cleanup React Testing Library
  cleanup();
});

afterAll(() => {
  // Stop MSW server after all tests
  server.close();
});

// ============================================================================
// Global Mocks
// ============================================================================

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Clerk authentication
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: {
      id: "test-user-id",
      firstName: "Test",
      lastName: "User",
      emailAddresses: [{ emailAddress: "test@example.com" }],
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  useAuth: () => ({
    userId: "test-user-id",
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn().mockResolvedValue("test-token"),
  }),
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  auth: () => ({ userId: "test-user-id" }),
  currentUser: () => Promise.resolve({
    id: "test-user-id",
    firstName: "Test",
    lastName: "User",
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
}));

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid-" + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// ============================================================================
// Custom Matchers
// ============================================================================

// Extend expect with custom matchers if needed
// Example:
// expect.extend({
//   toBeValidNode(received) {
//     // Custom validation logic
//     return { pass: true, message: () => '' };
//   }
// });

// ============================================================================
// Console Error Filtering
// ============================================================================

// Filter out expected warnings/errors during tests
const originalError = console.error;
console.error = (...args: unknown[]) => {
  // Filter out React act() warnings in tests
  if (
    typeof args[0] === "string" &&
    args[0].includes("Warning: An update to")
  ) {
    return;
  }
  originalError.call(console, ...args);
};
