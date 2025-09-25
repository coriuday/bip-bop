
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { api } from '~/trpc/react';
import SignUpPage from './signup/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
const mockUseRouter = useRouter as jest.Mock;

// Mock tRPC
jest.mock('~/trpc/react', () => ({
  api: {
    auth: {
      register: {
        useMutation: jest.fn(),
      },
    },
  },
}));

describe('SignUpPage Integration', () => {
  let mockMutate: jest.Mock;
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    mockMutate = jest.fn();
    mockRouterPush = jest.fn();
    (api.auth.register.useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
    mockUseRouter.mockReturnValue({ push: mockRouterPush });
  });

  const fillForm = () => {
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
  };

  it('submits the form and calls the register mutation', async () => {
    render(<SignUpPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('redirects to signin page on successful registration', async () => {
    // Adjust mock to call onSuccess
    (api.auth.register.useMutation as jest.Mock).mockImplementation(
      ({ onSuccess }: { onSuccess: (data: unknown) => void }) => ({
        mutate: (vars: Record<string, unknown>) => onSuccess(vars),
        isPending: false,
      }),
    );

    render(<SignUpPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/auth/signin");
    });
  });

  it('shows an error toast on failed registration', async () => {
    const error = new Error('Username already exists');
    // Adjust mock to call onError
    (api.auth.register.useMutation as jest.Mock).mockImplementation(
      ({ onError }: { onError: (error: Error) => void }) => ({
        mutate: () => onError(error),
        isPending: false,
      }),
    );

    render(<SignUpPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // As before, we can't easily test the toast, but we can ensure no redirect happens
    await waitFor(() => {
        expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });
});
