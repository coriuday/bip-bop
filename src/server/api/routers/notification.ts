import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          cursor: z.string().optional(),
          limit: z.number().min(1).max(50).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      const notifications = await ctx.db.notification.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          video: {
            select: {
              id: true,
              title: true,
              filePath: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit + 1, // Fetch one extra to determine if there's a next page
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (notifications.length > limit) {
        const lastItem = notifications.pop();
        nextCursor = lastItem?.id;
      }

      return { items: notifications, nextCursor };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
    });

    return count;
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.update({
        where: {
          id: input.notificationId,
          userId: ctx.session.user.id,
        },
        data: {
          read: true,
        },
      });

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return { success: true };
  }),

  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.delete({
        where: {
          id: input.notificationId,
          userId: ctx.session.user.id,
        },
      });

      return { success: true };
    }),
});
