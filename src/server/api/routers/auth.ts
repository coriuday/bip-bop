import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { checkRateLimit } from "~/lib/rate-limit";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "Username can only contain letters, numbers, underscores, and dots"
    ),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z.string().min(1, "Name is required").max(100),
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
      // Rate limit: 5 registration attempts per minute per IP
      const ip = ctx.headers.get("x-forwarded-for") ?? ctx.headers.get("x-real-ip") ?? "unknown";
      checkRateLimit(`auth.register:${ip}`, 5, 60_000);

      const usernameTrimmed = input.username.trim();
      const nameTrimmed = input.name.trim();
      const emailNormalized = input.email.trim().toLowerCase();
      const { password } = input;

      // Check if user already exists
      const existingUser = await ctx.db.user.findFirst({
        where: {
          OR: [
            { email: emailNormalized },
            { username: usernameTrimmed },
          ],
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: existingUser.email === emailNormalized 
            ? "User with this email already exists" 
            : "Username is already taken",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await ctx.db.user.create({
        data: {
          username: usernameTrimmed,
          email: emailNormalized,
          password: hashedPassword,
          name: nameTrimmed,
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