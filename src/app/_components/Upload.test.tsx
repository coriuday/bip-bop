
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDropzone } from 'react-dropzone';
import { api } from '~/trpc/react';
import Upload from './upload';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(),
}));
const mockUseDropzone = useDropzone as jest.Mock;

// Mock tRPC
jest.mock('~/trpc/react', () => ({
  api: {
    video: {
      create: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Mock XMLHttpRequest
global.XMLHttpRequest = jest.fn(() => {
  const xhr = {
    open: jest.fn(),
    send: jest.fn(),
    upload: { onprogress: null as ((this: XMLHttpRequestUpload, ev: ProgressEvent<EventTarget>) => unknown) | null },
    onload: null as ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) | null,
    onerror: null as ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) | null,
    responseText: '{}',
    status: 200,
  };
  return xhr as unknown as XMLHttpRequest;
});

describe('Upload component', () => {
  let mockMutate: jest.Mock;
  let onDrop: (acceptedFiles: File[]) => void;

  beforeEach(() => {
    mockMutate = jest.fn();
    (api.video.create.useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
    });

    // Capture the onDrop function
    mockUseDropzone.mockImplementation(({ onDrop: onDropFunc }: { onDrop: (files: File[]) => void }) => {
      onDrop = onDropFunc;
      return {
        getRootProps: jest.fn(() => ({})),
        getInputProps: jest.fn(() => ({})),
        isDragActive: false,
      };
    });
  });

  it('renders the form correctly', () => {
    render(<Upload />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/video file/i)).toBeInTheDocument();
  });

  it('shows an error if title is missing on drop', () => {
    render(<Upload />);
    const file = new File(['dummy content'], 'test.mp4', { type: 'video/mp4' });
    onDrop([file]);
    // We can't easily test for toasts without a provider, 
    // but we can check that the mutation was not called.
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('initiates upload when a file is dropped with a title', async () => {
    render(<Upload />);
    
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'My Test Video' } });

    const file = new File(['dummy content'], 'test.mp4', { type: 'video/mp4' });
    onDrop([file]);

    expect(global.XMLHttpRequest).toHaveBeenCalled();
  });
});
