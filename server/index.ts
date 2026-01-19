import { createTRPCRouter } from "@/server/trpc";
import { workflowRouter } from "@/server/routers/workflow.router";
import { llmRouter } from "@/server/routers/llm.router";
import { folderRouter } from "@/server/routers/folder.router";
import { executionRouter } from "@/server/routers/execution.router";
import { cropImageRouter } from "@/server/routers/cropImage.router";

/**
 * Main tRPC router
 * Combines all sub-routers
 */
export const appRouter = createTRPCRouter({
  workflow: workflowRouter,
  llm: llmRouter,
  folder: folderRouter,
  execution: executionRouter,
  cropImage: cropImageRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
