import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { tasks, runs } from "@trigger.dev/sdk/v3";

/**
 * tRPC Router for Crop Image Operations
 * 
 * This router handles the execution of image cropping via Trigger.dev tasks.
 * It triggers the crop-image task with FFmpeg and polls for the result.
 */
export const cropImageRouter = createTRPCRouter({
  execute: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        width: z.number().min(1).max(100),
        height: z.number().min(1).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const transloaditKey = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY;

      if (!transloaditKey) {
        throw new Error("Transloadit key is not configured");
      }

      try {
        console.log("[Crop Router] Triggering crop-image task", {
          imageUrl: input.imageUrl,
          crop: { x: input.x, y: input.y, width: input.width, height: input.height },
        });

        // Trigger the crop image task
        const handle = await tasks.trigger("crop-image", {
          imageUrl: input.imageUrl,
          x: input.x,
          y: input.y,
          width: input.width,
          height: input.height,
          transloaditKey,
        });

        console.log("[Crop Router] Task triggered, Run ID:", handle.id);

        // Poll for the result with timeout
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout
        
        while (attempts < maxAttempts) {
          const run = await runs.retrieve(handle.id);
          
          if (attempts % 5 === 0) {
            console.log(`[Crop Router] Polling (${attempts + 1}/${maxAttempts}):`, run.status);
          }
          
          if (run.status === "COMPLETED") {
            console.log("[Crop Router] Task completed successfully");
            
            // Validate output
            if (!run.output || !run.output.croppedImageUrl) {
              throw new Error("Crop task completed but no image URL was returned");
            }
            
            return {
              success: true,
              croppedImageUrl: run.output.croppedImageUrl,
            };
          } else if (run.status === "FAILED" || run.status === "CRASHED") {
            const errorMessage = run.output?.error || "Crop task failed without error message";
            console.error("[Crop Router] Task failed:", errorMessage);
            throw new Error(errorMessage);
          } else if (run.status === "CANCELED") {
            throw new Error("Crop task was canceled");
          }
          
          // Wait 1 second before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
        
        console.error("[Crop Router] Task timed out after 60 seconds");
        throw new Error("Crop task timed out - operation took longer than expected");
      } catch (error) {
        console.error("[Crop Router] Error:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to crop image"
        );
      }
    }),
});
