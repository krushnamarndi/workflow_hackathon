import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import superjson from "superjson";

/**
 * Create the tRPC context
 */
export async function createTRPCContext() {
  const authResult = await auth();
  
  return {
    prisma,
    userId: authResult.userId,
    auth: authResult,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC with the context
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
