import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const commentRouter = createTRPCRouter({
  getByVideoId: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.comment.findMany({
        where: { videoId: input.videoId },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });
    }),

  create: protectedProcedure
    .input(z.object({ videoId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.create({
        data: {
          content: input.content,
          videoId: input.videoId,
          userId: ctx.session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      // Get video owner to create notification
      const video = await ctx.db.video.findUnique({
        where: { id: input.videoId },
        select: { userId: true },
      });

      // Don't notify if user comments on their own video
      if (video && video.userId !== ctx.session.user.id) {
        await ctx.db.notification.create({
          data: {
            type: "comment",
            content: "commented on your video",
            userId: video.userId,
            actorId: ctx.session.user.id,
            videoId: input.videoId,
          },
        });
      }

      return comment;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!comment) {
        throw new Error("Comment not found");
      }

      if (comment.userId !== ctx.session.user.id) {
        throw new Error("Not authorized");
      }

      await ctx.db.comment.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});