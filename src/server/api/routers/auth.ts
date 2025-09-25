import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(100),
});

/**
 * Registers a new user in the database.
 * Publicly accessible.
 * @param input - The user's registration details (username, email, password, name).
 * @throws {TRPCError} - Throws a CONFLICT error if the username or email is already taken.
 */
export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      const { username, email, password, name } = input;

      // Check if user already exists
      const existingUser = await ctx.db.user.findFirst({
        where: {
          OR: [
            { email },
            { username },
          ],
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: existingUser.email === email 
            ? "User with this email already exists" 
            : "Username is already taken",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await ctx.db.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          name,
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        message: "User created successfully",
        user,
      };
    }),
});