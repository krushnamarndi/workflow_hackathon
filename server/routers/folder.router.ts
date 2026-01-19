import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/trpc";

export const folderRouter = createTRPCRouter({
  /**
   * Create a new folder
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Folder name is required"),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // If parentId is provided, verify it exists and user has access
        if (input.parentId) {
          const parentFolder = await ctx.prisma.folder.findUnique({
            where: { id: input.parentId },
          });

          if (!parentFolder) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Parent folder not found",
            });
          }

          if (parentFolder.userId !== ctx.userId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to create a folder here",
            });
          }
        }

        const folder = await ctx.prisma.folder.create({
          data: {
            userId: ctx.userId,
            name: input.name,
            parentId: input.parentId,
          },
        });

        return folder;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create folder",
          cause: error,
        });
      }
    }),

  /**
   * Update folder name
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Folder name is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingFolder = await ctx.prisma.folder.findUnique({
          where: { id: input.id },
        });

        if (!existingFolder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found",
          });
        }

        if (existingFolder.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this folder",
          });
        }

        const folder = await ctx.prisma.folder.update({
          where: { id: input.id },
          data: { name: input.name },
        });

        return folder;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update folder",
          cause: error,
        });
      }
    }),

  /**
   * Delete a folder
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const existingFolder = await ctx.prisma.folder.findUnique({
          where: { id: input.id },
        });

        if (!existingFolder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found",
          });
        }

        if (existingFolder.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this folder",
          });
        }

        await ctx.prisma.folder.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete folder",
          cause: error,
        });
      }
    }),

  /**
   * Get folder by ID with contents
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const folder = await ctx.prisma.folder.findUnique({
          where: { id: input.id },
          include: {
            children: {
              orderBy: { name: "asc" },
            },
            workflows: {
              orderBy: { updatedAt: "desc" },
            },
          },
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
            message: "You don't have permission to view this folder",
          });
        }

        return folder;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch folder",
          cause: error,
        });
      }
    }),

  /**
   * List root folders and workflows (not in any folder)
   */
  listRoot: protectedProcedure.query(async ({ ctx }) => {
    try {
      const folders = await ctx.prisma.folder.findMany({
        where: {
          userId: ctx.userId,
          parentId: null,
        },
        orderBy: { name: "asc" },
      });

      const workflows = await ctx.prisma.workflow.findMany({
        where: {
          userId: ctx.userId,
          folderId: null,
        },
        orderBy: { updatedAt: "desc" },
      });

      return { folders, workflows };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch files",
        cause: error,
      });
    }
  }),

  /**
   * Get folder breadcrumb path
   */
  getBreadcrumb: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const breadcrumb: Array<{ id: string; name: string }> = [];
        let currentId: string | null = input.id;

        while (currentId) {
          const folder: { id: string; name: string; parentId: string | null; userId: string } | null = await ctx.prisma.folder.findUnique({
            where: { id: currentId },
            select: { id: true, name: true, parentId: true, userId: true },
          });

          if (!folder) break;

          if (folder.userId !== ctx.userId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to view this folder",
            });
          }

          breadcrumb.unshift({ id: folder.id, name: folder.name });
          currentId = folder.parentId;
        }

        return breadcrumb;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch breadcrumb",
          cause: error,
        });
      }
    }),

  /**
   * Search folders and workflows
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        folderId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const searchTerm = input.query.toLowerCase();

        const folders = await ctx.prisma.folder.findMany({
          where: {
            userId: ctx.userId,
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
            ...(input.folderId && { parentId: input.folderId }),
          },
          orderBy: { name: "asc" },
        });

        const workflows = await ctx.prisma.workflow.findMany({
          where: {
            userId: ctx.userId,
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
            ...(input.folderId && { folderId: input.folderId }),
          },
          orderBy: { updatedAt: "desc" },
        });

        return { folders, workflows };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search",
          cause: error,
        });
      }
    }),

  /**
   * List all folders for the current user (for move dialog)
   */
  listAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const folders = await ctx.prisma.folder.findMany({
        where: { userId: ctx.userId },
        orderBy: { name: "asc" },
      });

      return folders;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch folders",
        cause: error,
      });
    }
  }),

  /**
   * Move a folder to a different parent
   */
  move: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        parentId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingFolder = await ctx.prisma.folder.findUnique({
          where: { id: input.id },
        });

        if (!existingFolder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found",
          });
        }

        if (existingFolder.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to move this folder",
          });
        }

        // If moving to a parent folder, verify it exists and prevent circular references
        if (input.parentId) {
          const parentFolder = await ctx.prisma.folder.findUnique({
            where: { id: input.parentId },
          });

          if (!parentFolder) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Target folder not found",
            });
          }

          if (parentFolder.userId !== ctx.userId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to move to this folder",
            });
          }

          // Prevent moving a folder into itself or its descendants
          if (input.parentId === input.id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot move a folder into itself",
            });
          }

          // Check if parentId is a descendant of the folder being moved
          let currentParentId = parentFolder.parentId;
          while (currentParentId) {
            if (currentParentId === input.id) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot move a folder into its own descendant",
              });
            }
            const ancestorFolder = await ctx.prisma.folder.findUnique({
              where: { id: currentParentId },
            });
            currentParentId = ancestorFolder?.parentId || null;
          }
        }

        const folder = await ctx.prisma.folder.update({
          where: { id: input.id },
          data: { parentId: input.parentId },
        });

        return folder;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to move folder",
          cause: error,
        });
      }
    }),
});
