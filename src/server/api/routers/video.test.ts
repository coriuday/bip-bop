
import { appRouter } from '~/server/api/root';
import { type Session } from 'next-auth';
import type { PrismaClient } from '@prisma/client';

// Mock the database
const mockDb = {
  video: {
    create: jest.fn(),
  },
  like: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
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

describe('videoRouter', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create mutation', () => {
    it('should create a video record successfully', async () => {
      const input = {
        title: 'Test Video',
        description: 'A great video',
        filePath: '/uploads/test.mp4',
        fileSize: 12345,
      };

      mockDb.video.create.mockResolvedValue({ ...input, id: 1, userId: 'test-user-id' });

      const result = await caller.video.create(input);

      expect(result).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(mockDb.video.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('toggleLike mutation', () => {
    it('should create a like if one does not exist', async () => {
      mockDb.like.findUnique.mockResolvedValue(null);
      mockDb.like.create.mockResolvedValue({});

      const result = await caller.video.toggleLike({ videoId: 1 });

      expect(result.liked).toBe(true);
      expect(mockDb.like.findUnique).toHaveBeenCalledTimes(1);
      expect(mockDb.like.create).toHaveBeenCalledTimes(1);
      expect(mockDb.like.delete).not.toHaveBeenCalled();
    });

    it('should delete a like if it already exists', async () => {
      mockDb.like.findUnique.mockResolvedValue({ id: 1, userId: 'test-user-id', videoId: 1 });
      mockDb.like.delete.mockResolvedValue({});

      const result = await caller.video.toggleLike({ videoId: 1 });

      expect(result.liked).toBe(false);
      expect(mockDb.like.findUnique).toHaveBeenCalledTimes(1);
      expect(mockDb.like.delete).toHaveBeenCalledTimes(1);
      expect(mockDb.like.create).not.toHaveBeenCalled();
    });
  });
});
