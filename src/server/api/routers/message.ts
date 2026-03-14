import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { MessageStatus } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { checkRateLimit } from "~/lib/rate-limit";
import { pusherServer, conversationChannel, PUSHER_EVENTS } from "~/lib/pusher";

export const messageRouter = createTRPCRouter({
  /**
   * Get all conversations for the current user
   */
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const conversations = await ctx.db.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
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
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return conversations.map((conv) => ({
      ...conv,
      otherParticipant: conv.participants.find((p) => p.userId !== userId)?.user,
      lastMessage: conv.messages[0],
    }));
  }),

  /**
   * Get messages for a specific conversation
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { conversationId, cursor, limit } = input;

      // Security: verify the caller is a participant in this conversation
      const participant = await ctx.db.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant in this conversation.",
        });
      }

      const messages = await ctx.db.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return { items: messages, nextCursor };
    }),

  /**
   * Send a message
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().optional(),
        recipientId: z.string(),
        content: z.string().max(2000).default(""),
        mediaUrl: z.string().url().optional(),
        mediaType: z.enum(["image", "video"]).optional(),
      }).refine(
        (d) => d.content.trim().length > 0 || !!d.mediaUrl,
        { message: "Message must have text or an attachment" }
      )
    )
    .mutation(async ({ ctx, input }) => {
      const senderId = ctx.session.user.id;

      // Rate limit: 30 messages per minute per user
      checkRateLimit(`sendMessage:${senderId}`, 30, 60_000);

      const { conversationId, recipientId } = input;

      let convId = conversationId;

      // If no conversation ID, find or create one atomically inside a transaction
      convId ??= await ctx.db.$transaction(async (tx) => {
          const existingConv = await tx.conversation.findFirst({
            where: {
              AND: [
                {
                  participants: {
                    some: {
                      userId: senderId,
                    },
                  },
                },
                {
                  participants: {
                    some: {
                      userId: recipientId,
                    },
                  },
                },
              ],
            },
          });

          if (existingConv) {
            return existingConv.id;
          }

          // Create new conversation
          const newConv = await tx.conversation.create({
            data: {
              participants: {
                create: [
                  { userId: senderId },
                  { userId: recipientId },
                ],
              },
            },
          });
          return newConv.id;
        });

      // Create the message
      const message = await ctx.db.message.create({
        data: {
          content: input.content ?? "",
          mediaUrl: input.mediaUrl,
          mediaType: input.mediaType,
          senderId,
          conversationId: convId,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      // Update conversation timestamp
      await ctx.db.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
      });

      return {
        ...message,
        conversationId: convId,
      };
    }),

  /**
   * Mark conversation as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Update conversation participant
      await ctx.db.conversationParticipant.updateMany({
        where: {
          conversationId: input.conversationId,
          userId,
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      // Mark all messages in conversation as read
      await ctx.db.message.updateMany({
        where: {
          conversationId: input.conversationId,
          senderId: { not: userId }, // Only mark others' messages
          status: { not: MessageStatus.read },
        },
        data: {
          status: MessageStatus.read,
          readAt: new Date(),
        },
      });

      return { success: true };
    }),

  /**
   * Mark messages as delivered when user opens conversation
   */
  markAsDelivered: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.db.message.updateMany({
        where: {
          conversationId: input.conversationId,
          senderId: { not: userId },
          status: MessageStatus.sent,
        },
        data: {
          status: MessageStatus.delivered,
        },
      });

      return { success: true };
    }),

  /**
   * Toggle a reaction on a message
   */
  toggleReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        emoji: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { messageId, emoji } = input;

      const message = await ctx.db.message.findUnique({
        where: { id: messageId },
        include: { conversation: { include: { participants: true } } },
      });

      if (!message) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
      }

      const isParticipant = message.conversation.participants.some((p: { userId: string }) => p.userId === userId);
      if (!isParticipant) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }

      // Parse the reactions JSON
      const currentReactions: Record<string, string[]> = 
        (message.reactions as Record<string, string[]> | null) ?? {};

      // Toggle logic
      currentReactions[emoji] ??= [];

      const userIndex = currentReactions[emoji].indexOf(userId);

      if (userIndex > -1) {
        // Remove user
        currentReactions[emoji].splice(userIndex, 1);
        // If empty array, cleanup the key
        if (currentReactions[emoji].length === 0) {
          delete currentReactions[emoji];
        }
      } else {
        // Add user
        currentReactions[emoji].push(userId);
      }

      await ctx.db.message.update({
        where: { id: messageId },
        data: { reactions: currentReactions },
      });

      // Broadcast the update
      void pusherServer.trigger(conversationChannel(message.conversationId), PUSHER_EVENTS.MESSAGE_STATUS, {
        type: "message:reaction",
        messageId,
        reactions: currentReactions,
      });

      return { success: true, reactions: currentReactions };
    }),

  /**
   * Broadcast a typing indicator over Pusher (no DB write, fire-and-forget).
   */
  sendTyping: protectedProcedure
    .input(z.object({ conversationId: z.string(), isTyping: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify participant
      const participant = await ctx.db.conversationParticipant.findFirst({
        where: { conversationId: input.conversationId, userId },
      });
      if (!participant) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      void pusherServer.trigger(
        conversationChannel(input.conversationId),
        "typing",
        { userId, isTyping: input.isTyping },
      );

      return { success: true };
    }),

  /**
   * Create a new group conversation with multiple participants.
   */
  createGroupConversation: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(60),
      participantIds: z.array(z.string()).min(1).max(49),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      // Creator is always a participant
      const allParticipants = [...new Set([userId, ...input.participantIds])];

      const conversation = await ctx.db.conversation.create({
        data: {
          participants: {
            create: allParticipants.map((id) => ({ userId: id })),
          },
        },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, username: true, image: true } },
            },
          },
        },
      });

      return conversation;
    }),

  /**
   * Share a BipBop video inside a conversation (creates a message of type "video").
   */
  shareVideo: protectedProcedure
    .input(z.object({
      conversationId: z.string().optional(),
      recipientId: z.string().optional(),
      videoId: z.number(),
      comment: z.string().max(500).default(""),
    }))
    .mutation(async ({ ctx, input }) => {
      const senderId = ctx.session.user.id;
      const { videoId, comment } = input;

      // Fetch the video's filePath to use as mediaUrl
      const video = await ctx.db.video.findUnique({
        where: { id: videoId },
        select: { id: true, title: true, filePath: true, thumbnailUrl: true },
      });

      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }

      let convId = input.conversationId;

      if (!convId) {
        if (!input.recipientId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "recipientId or conversationId required" });
        }
        // Find or create 1-to-1 conversation
        const existingConv = await ctx.db.conversation.findFirst({
          where: {
            AND: [
              { participants: { some: { userId: senderId } } },
              { participants: { some: { userId: input.recipientId } } },
            ],
          },
        });

        if (existingConv) {
          convId = existingConv.id;
        } else {
          const newConv = await ctx.db.conversation.create({
            data: {
              participants: {
                create: [{ userId: senderId }, { userId: input.recipientId }],
              },
            },
          });
          convId = newConv.id;
        }
      }

      const message = await ctx.db.message.create({
        data: {
          content: comment || `📹 Shared a video: ${video.title ?? "Video"}`,
          mediaUrl: video.thumbnailUrl ?? video.filePath,
          mediaType: "video",
          senderId,
          conversationId: convId,
        },
        include: {
          sender: { select: { id: true, name: true, username: true, image: true } },
        },
      });

      // Update conversation timestamp
      await ctx.db.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
      });

      // Broadcast via Pusher
      void pusherServer.trigger(conversationChannel(convId), PUSHER_EVENTS.NEW_MESSAGE, {
        ...message,
        videoRef: { id: videoId, title: video.title, filePath: video.filePath },
      });

      return { ...message, conversationId: convId };
    }),
});

