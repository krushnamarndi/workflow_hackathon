/**
 * MSW Server Configuration
 * 
 * This server is used in Node.js environments (Vitest tests).
 * For browser testing, use the browser.ts file instead.
 */

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW server instance for Node.js testing
 * 
 * Usage:
 * - Automatically started in tests/setup.ts
 * - Use server.use() to add request-specific handlers
 * - Use server.resetHandlers() between tests
 */
export const server = setupServer(...handlers);
