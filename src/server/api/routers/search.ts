import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const searchRouter = createTRPCRouter({
  /**
   * Search for users and videos
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        type: z.enum(["all", "users", "videos"]).default("all"),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, type, limit } = input;

      type UserResult = {
        id: string;
        name: string | null;
        username: string | null;
        image: string | null;
        _count: {
          followers: number;
          videos: number;
        };
      };

      type VideoResult = {
        id: number;
        title: string | null;
        description: string | null;
        filePath: string;
        fileSize: number;
        duration: number | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        user: {
          id: string;
          name: string | null;
          username: string | null;
          image: string | null;
        };
        _count: {
          likes: number;
          comments: number;
        };
      };

      let users: UserResult[] = [];
      let videos: VideoResult[] = [];

      if (type === "all" || type === "users") {
        users = await ctx.db.user.findMany({
          where: {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            _count: {
              select: {
                followers: true,
                videos: true,
              },
            },
          },
          take: type === "users" ? limit : Math.floor(limit / 2),
        });
      }

      if (type === "all" || type === "videos") {
        videos = await ctx.db.video.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
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
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
          take: type === "videos" ? limit : Math.floor(limit / 2),
          orderBy: {
            createdAt: "desc",
          },
        });
      }

      return {
        users,
        videos,
      };
    }),

  /**
   * Get trending/suggested users
   */
  getTrendingUsers: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          _count: {
            select: {
              followers: true,
              videos: true,
            },
          },
        },
        orderBy: {
          followers: {
            _count: "desc",
          },
        },
        take: input.limit,
      });

      return users;
    }),

  /**
   * Get trending videos
   */
  getTrendingVideos: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const videos = await ctx.db.video.findMany({
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
        orderBy: {
          likes: {
            _count: "desc",
          },
        },
        take: input.limit,
      });

      return videos;
    }),
});
