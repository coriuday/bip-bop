
import { TRPCError } from '@trpc/server';
import { appRouter } from '~/server/api/root';
import { type Session } from 'next-auth';
import type { PrismaClient } from '@prisma/client';

// Mock the database
const mockDb = {
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

// Mock session
const mockSession: Session = {
  user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
  expires: new Date(Date.now() + 86400 * 1000).toISOString(),
};

const caller = appRouter.createCaller({
  db: mockDb as unknown as PrismaClient,
  session: mockSession,
});

describe('authRouter', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register mutation', () => {
    it('should create a new user successfully', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({
        id: 'new-user-id',
        username: 'newuser',
        email: 'new@example.com',
        name: 'New User',
      });

      const input = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      const result = await caller.auth.register(input);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(mockDb.user.findFirst).toHaveBeenCalledTimes(1);
      expect(mockDb.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw a CONFLICT error if email already exists', async () => {
      mockDb.user.findFirst.mockResolvedValue({ email: 'existing@example.com' });

      const input = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
        name: 'New User',
      };

      await expect(caller.auth.register(input)).rejects.toThrow(TRPCError);
      await expect(caller.auth.register(input)).rejects.toHaveProperty('code', 'CONFLICT');
    });

    it('should throw a CONFLICT error if username is taken', async () => {
      mockDb.user.findFirst.mockResolvedValue({ username: 'existinguser' });

      const input = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      await expect(caller.auth.register(input)).rejects.toThrow(TRPCError);
      await expect(caller.auth.register(input)).rejects.toHaveProperty('code', 'CONFLICT');
    });
  });
});
