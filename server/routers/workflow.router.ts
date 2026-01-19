import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/trpc";
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  deleteWorkflowSchema,
  getWorkflowSchema,
} from "@/server/schemas/workflow.schema";

export const workflowRouter = createTRPCRouter({
  /**
   * Create a new workflow
   */
  create: protectedProcedure
    .input(createWorkflowSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // If folderId is provided, verify it exists and user has access
        if (input.folderId) {
          const folder = await ctx.prisma.folder.findUnique({
            where: { id: input.folderId },
          });

          if (!folder) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Folder not found",
            });
          }

          if (folder.userId !== ctx.userId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to create a workflow in this folder",
            });
          }
        }

        const workflow = await ctx.prisma.workflow.create({
          data: {
            userId: ctx.userId,
            name: input.name,
            description: input.description,
            data: input.data as any,
            folderId: input.folderId,
          },
        });

        return workflow;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create workflow",
          cause: error,
        });
      }
    }),

  /**
   * Update an existing workflow
   */
  update: protectedProcedure
    .input(updateWorkflowSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const existingWorkflow = await ctx.prisma.workflow.findUnique({
          where: { id: input.id },
        });

        if (!existingWorkflow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }

        if (existingWorkflow.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this workflow",
          });
        }

        const workflow = await ctx.prisma.workflow.update({
          where: { id: input.id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.data && { data: input.data as any }),
            ...(input.folderId !== undefined && { folderId: input.folderId }),
          },
        });

        return workflow;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update workflow",
          cause: error,
        });
      }
    }),

  /**
   * Delete a workflow
   */
  delete: protectedProcedure
    .input(deleteWorkflowSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const existingWorkflow = await ctx.prisma.workflow.findUnique({
          where: { id: input.id },
        });

        if (!existingWorkflow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }

        if (existingWorkflow.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this workflow",
          });
        }

        await ctx.prisma.workflow.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete workflow",
          cause: error,
        });
      }
    }),

  /**
   * Get a workflow by ID
   */
  get: protectedProcedure
    .input(getWorkflowSchema)
    .query(async ({ ctx, input }) => {
      try {
        const workflow = await ctx.prisma.workflow.findUnique({
          where: { id: input.id },
        });

        if (!workflow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }

        if (workflow.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this workflow",
          });
        }

        return workflow;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch workflow",
          cause: error,
        });
      }
    }),

  /**
   * List all workflows for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const workflows = await ctx.prisma.workflow.findMany({
        where: { userId: ctx.userId },
        orderBy: { updatedAt: "desc" },
      });

      return workflows;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch workflows",
        cause: error,
      });
    }
  }),

  /**
   * Duplicate a workflow
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const existingWorkflow = await ctx.prisma.workflow.findUnique({
          where: { id: input.id },
        });

        if (!existingWorkflow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }

        if (existingWorkflow.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to duplicate this workflow",
          });
        }

        const workflow = await ctx.prisma.workflow.create({
          data: {
            userId: ctx.userId,
            name: `${existingWorkflow.name} (Copy)`,
            description: existingWorkflow.description,
            data: existingWorkflow.data as any,
            folderId: existingWorkflow.folderId,
          },
        });

        return workflow;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to duplicate workflow",
          cause: error,
        });
      }
    }),

  /**
   * Rename a workflow
   */
  rename: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Workflow name is required").max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingWorkflow = await ctx.prisma.workflow.findUnique({
          where: { id: input.id },
        });

        if (!existingWorkflow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }

        if (existingWorkflow.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to rename this workflow",
          });
        }

        const workflow = await ctx.prisma.workflow.update({
          where: { id: input.id },
          data: { name: input.name },
        });

        return workflow;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to rename workflow",
          cause: error,
        });
      }
    }),

  /**
   * Move a workflow to a different folder
   */
  move: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        folderId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingWorkflow = await ctx.prisma.workflow.findUnique({
          where: { id: input.id },
        });

        if (!existingWorkflow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }

        if (existingWorkflow.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to move this workflow",
          });
        }

        // If moving to a folder, verify it exists and user has access
        if (input.folderId) {
          const folder = await ctx.prisma.folder.findUnique({
            where: { id: input.folderId },
          });

          if (!folder) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Target folder not found",
            });
          }

          if (folder.userId !== ctx.userId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to move to this folder",
            });
          }
        }

        const workflow = await ctx.prisma.workflow.update({
          where: { id: input.id },
          data: { folderId: input.folderId },
        });

        return workflow;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to move workflow",
          cause: error,
        });
      }
    }),
});
