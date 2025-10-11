import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
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
      take: 50,
    });

    return notifications;
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
