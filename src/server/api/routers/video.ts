import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { NotificationType } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { moderateVideoMetadata } from "~/lib/content-moderation";
import { checkRateLimit } from "~/lib/rate-limit";

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
        duration: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { title, description, filePath, fileSize, duration } = input;
      const userId = ctx.session.user.id;

      // Rate limit: 10 uploads per hour per user
      checkRateLimit(`video.create:${userId}`, 10, 60 * 60_000);

      // Content moderation (static import, no dynamic import overhead)
      const moderationResult = moderateVideoMetadata({
        title,
        description: description ?? undefined,
      });

      if (!moderationResult.allowed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Content policy violation: ${moderationResult.reason}. Please review our community guidelines.`,
        });
      }

      const video = await ctx.db.video.create({
        data: {
          title,
          description,
          filePath,
          fileSize,
          duration,
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
              username: true,
              image: true,
            },
          },
          likes: userId ? { where: { userId } } : false,
          bookmarks: userId ? { where: { userId } } : false,
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the extra item
        nextCursor = nextItem!.id;
      }

      return {
        items: items.map((item) => ({
          ...item,
          // In unauthenticated requests, `likes` is `false` per include config; default to empty array
          userHasLiked: Array.isArray(item.likes)
            ? item.likes.length > 0
            : false,
          userHasBookmarked: Array.isArray(item.bookmarks)
            ? item.bookmarks.length > 0
            : false,
        })),
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

        // Get video owner to create notification
        const video = await ctx.db.video.findUnique({
          where: { id: videoId },
          select: { userId: true },
        });

        // Don't notify if user likes their own video
        if (video && video.userId !== userId) {
          await ctx.db.notification.create({
            data: {
              type: NotificationType.like,
              content: "liked your video",
              userId: video.userId,
              actorId: userId,
              videoId: videoId,
            },
          });
        }

        return { liked: true };
      }
    }),

  /**
   * Toggles a bookmark on a video for the currently authenticated user.
   * If the user has already bookmarked the video, it removes it. Otherwise, it bookmarks it.
   * @param input - The ID of the video to bookmark/unbookmark.
   */
  toggleBookmark: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { videoId } = input;
      const userId = ctx.session.user.id;

      const existingBookmark = await ctx.db.bookmark.findUnique({
        where: {
          userId_videoId: {
            userId,
            videoId,
          },
        },
      });

      if (existingBookmark) {
        await ctx.db.bookmark.delete({
          where: {
            id: existingBookmark.id,
          },
        });
        return { bookmarked: false };
      } else {
        await ctx.db.bookmark.create({
          data: {
            user: {
              connect: { id: userId },
            },
            video: {
              connect: { id: videoId },
            },
          },
        });
        return { bookmarked: true };
      }
    }),

  /**
   * Record a video view (with 24h deduplication per user)
   */
  recordView: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { videoId } = input;
      const userId = ctx.session.user.id;

      // Check if user viewed this video in the last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentView = await ctx.db.videoView.findFirst({
        where: {
          videoId,
          userId,
          viewedAt: {
            gte: yesterday
          }
        }
      });

      if (recentView) {
        return { success: false, reason: "Already viewed recently" };
      }

      // Record new view
      await ctx.db.$transaction([
        ctx.db.videoView.create({
          data: {
            videoId,
            userId,
          }
        }),
        ctx.db.video.update({
          where: { id: videoId },
          data: {
            viewCount: { increment: 1 }
          }
        })
      ]);

      return { success: true };
    }),

  /**
   * Get liked videos for the currently authenticated user
   */
  getLikedVideos: protectedProcedure
    .input(
      z.object({
        cursor: z.number().optional(),
        limit: z.number().min(1).max(50).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      const likes = await ctx.db.like.findMany({
        where: { userId },
        include: {
          video: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      let nextCursor: number | undefined;
      if (likes.length > limit) {
        const nextItem = likes.pop();
        nextCursor = nextItem?.id;
      }

      return { items: likes.map((l) => l.video), nextCursor };
    }),

  /**
   * Get saved/bookmarked videos for the currently authenticated user
   */
  getSavedVideos: protectedProcedure
    .input(
      z.object({
        cursor: z.number().optional(),
        limit: z.number().min(1).max(50).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      const bookmarks = await ctx.db.bookmark.findMany({
        where: { userId },
        include: {
          video: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      let nextCursor: number | undefined;
      if (bookmarks.length > limit) {
        const nextItem = bookmarks.pop();
        nextCursor = nextItem?.id;
      }

      return { items: bookmarks.map((b) => b.video), nextCursor };
    }),

  /**
   * Delete a video owned by the authenticated user
   */
  deleteVideo: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.db.video.findUnique({ where: { id: input.videoId } });
      if (!video) throw new Error("Video not found");
      if (video.userId !== ctx.session.user.id) throw new Error("Unauthorized");
      
      await ctx.db.video.delete({ where: { id: input.videoId } });
      return { success: true };
    }),
});
