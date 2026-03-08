import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { MessageStatus } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { checkRateLimit } from "~/lib/rate-limit";

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
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const senderId = ctx.session.user.id;

      // Rate limit: 30 messages per minute per user
      checkRateLimit(`sendMessage:${senderId}`, 30, 60_000);

      const { conversationId, recipientId, content } = input;

      let convId = conversationId;

      // If no conversation ID, find or create one atomically inside a transaction
      if (!convId) {
        convId = await ctx.db.$transaction(async (tx) => {
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
      }

      // Create the message
      const message = await ctx.db.message.create({
        data: {
          content,
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
});
