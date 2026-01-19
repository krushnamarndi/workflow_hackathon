import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import prisma from "@/lib/prisma";

export const executionRouter = createTRPCRouter({
  // Create a new workflow execution
  create: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        nodeId: z.string(),
        runId: z.string().optional(),
        status: z.enum(["running", "completed", "failed"]),
        input: z.any().optional(),
        output: z.any().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: input.workflowId,
          userId: ctx.userId,
          nodeId: input.nodeId,
          runId: input.runId,
          status: input.status,
          input: input.input,
          output: input.output,
          error: input.error,
          completedAt: input.status !== "running" ? new Date() : null,
        },
      });
      
      return execution;
    }),

  // Update execution status
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["running", "completed", "failed"]),
        output: z.any().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const execution = await prisma.workflowExecution.update({
        where: { id: input.id },
        data: {
          status: input.status,
          output: input.output,
          error: input.error,
          completedAt: input.status !== "running" ? new Date() : null,
        },
      });
      
      return execution;
    }),

  // List executions for a workflow
  list: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const executions = await prisma.workflowExecution.findMany({
        where: {
          workflowId: input.workflowId,
          userId: ctx.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
      });
      
      return executions;
    }),

  // Get execution by ID
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: input.id },
      });
      
      if (!execution || execution.userId !== ctx.userId) {
        throw new Error("Execution not found");
      }
      
      return execution;
    }),

  // Delete execution
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: input.id },
      });
      
      if (!execution || execution.userId !== ctx.userId) {
        throw new Error("Execution not found");
      }
      
      await prisma.workflowExecution.delete({
        where: { id: input.id },
      });
      
      return { success: true };
    }),

  // Delete all executions for a workflow
  deleteAll: protectedProcedure
    .input(z.object({ workflowId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.workflowExecution.deleteMany({
        where: {
          workflowId: input.workflowId,
          userId: ctx.userId,
        },
      });
      
      return { success: true };
    }),
});
