
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const videoRouter = createTRPCRouter({
  /**
   * Creates a new video record in the database.
   * Requires user to be authenticated.
   * @param input - The video metadata (title, description, filePath, fileSize).
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        filePath: z.string().min(1),
        fileSize: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { title, description, filePath, fileSize } = input;
      const userId = ctx.session.user.id;

      const video = await ctx.db.video.create({
        data: {
          title,
          description,
          filePath,
          fileSize,
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });

      return video;
    }),

  /**
   * Fetches a paginated feed of videos.
   * Publicly accessible.
   * Includes user information and like counts.
   * If a user is logged in, it also indicates if they have liked each video.
   * @param input - The pagination parameters (limit, cursor).
   */
  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().optional(), // Using a number cursor for simplicity
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const userId = ctx.session?.user.id;

      const items = await ctx.db.video.findMany({
        take: limit + 1, // get an extra item to see if there's a next page
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          likes: userId ? { where: { userId } } : false,
          _count: {
            select: { likes: true },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the extra item
        nextCursor = nextItem!.id;
      }

      return {
        items: items.map(item => ({ ...item, userHasLiked: item.likes.length > 0 })),
        nextCursor,
      };
    }),

  /**
   * Toggles a like on a video for the currently authenticated user.
   * If the user has already liked the video, it unlikes it. Otherwise, it likes it.
   * @param input - The ID of the video to like/unlike.
   */
  toggleLike: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { videoId } = input;
      const userId = ctx.session.user.id;

      const existingLike = await ctx.db.like.findUnique({
        where: {
          userId_videoId: {
            userId,
            videoId,
          },
        },
      });

      if (existingLike) {
        await ctx.db.like.delete({
          where: {
            id: existingLike.id,
          },
        });
        return { liked: false };
      } else {
        await ctx.db.like.create({
          data: {
            user: {
              connect: { id: userId },
            },
            video: {
              connect: { id: videoId },
            },
          },
        });
        return { liked: true };
      }
    }),
});
