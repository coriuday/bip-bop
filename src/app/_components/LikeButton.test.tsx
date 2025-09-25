
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession } from 'next-auth/react';
import { api } from '~/trpc/react';
import LikeButton from './like-button';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.Mock;

// Mock tRPC
jest.mock('~/trpc/react', () => ({
  api: {
    video: {
      toggleLike: {
        useMutation: jest.fn(),
      },
    },
    useUtils: () => ({
      video: {
        getFeed: {
          cancel: jest.fn(),
          getInfiniteData: jest.fn(),
          setInfiniteData: jest.fn(),
          invalidate: jest.fn(),
        },
      },
    }),
  },
}));

describe('LikeButton', () => {
  let mockMutate: jest.Mock;

  beforeEach(() => {
    mockMutate = jest.fn();
    (api.video.toggleLike.useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('renders with initial like count and state', () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'test-user' } }, status: 'authenticated' });
    render(<LikeButton videoId={1} initialLikes={10} userHasLiked={false} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('calls the mutation when an authenticated user clicks the button', () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'test-user' } }, status: 'authenticated' });
    render(<LikeButton videoId={1} initialLikes={10} userHasLiked={false} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockMutate).toHaveBeenCalledWith({ videoId: 1 });
  });

  it('does not call the mutation when an unauthenticated user clicks', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<LikeButton videoId={1} initialLikes={10} userHasLiked={false} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('optimistically updates the UI on click', () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'test-user' } }, status: 'authenticated' });
    render(<LikeButton videoId={1} initialLikes={10} userHasLiked={false} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // The text content will be the SVG path and the number, so we check for '11'
    expect(screen.getByText('11')).toBeInTheDocument();
  });
});
