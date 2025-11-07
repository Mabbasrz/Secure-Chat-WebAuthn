/**
 * CrypTalk - ChatWindow Component Tests
 * Testing message rendering, encryption, auto-scroll
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ChatWindow from '../../components/ChatWindow';

// Mock useCrypto hook
vi.mock('../../hooks/useCrypto', () => ({
  default: () => ({
    decryptMessage: vi.fn(async (ciphertext) => `Decrypted: ${ciphertext}`),
    recipientPublicKey: 'test-public-key',
  }),
}));

describe('ChatWindow Component', () => {
  const mockMessages = [
    {
      _id: 'msg1',
      sender: 'user123',
      receiver: 'user456',
      encryptedContent: 'base64-ciphertext-1',
      nonce: 'base64-nonce-1',
      createdAt: new Date('2025-01-01T10:00:00'),
    },
    {
      _id: 'msg2',
      sender: 'user456',
      receiver: 'user123',
      encryptedContent: 'base64-ciphertext-2',
      nonce: 'base64-nonce-2',
      createdAt: new Date('2025-01-01T10:05:00'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render message list', async () => {
    render(<ChatWindow messages={mockMessages} currentUserId="user123" />);

    await waitFor(() => {
      expect(screen.getByText(/Decrypted:/i)).toBeInTheDocument();
    });
  });

  it('should decrypt messages before displaying', async () => {
    const mockDecrypt = vi.fn(async (cipher) => 'Hello!');

    render(
      <ChatWindow
        messages={mockMessages}
        currentUserId="user123"
        onDecrypt={mockDecrypt}
      />
    );

    await waitFor(() => {
      expect(mockDecrypt).toHaveBeenCalled();
    });
  });

  it('should differentiate sent vs received messages', async () => {
    render(<ChatWindow messages={mockMessages} currentUserId="user123" />);

    await waitFor(() => {
      const messages = screen.getAllByRole('article');
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('should display timestamps', async () => {
    render(<ChatWindow messages={mockMessages} currentUserId="user123" />);

    await waitFor(() => {
      expect(screen.getByText(/10:00|10:05/)).toBeInTheDocument();
    });
  });

  it('should auto-scroll to latest message', async () => {
    const { container } = render(
      <ChatWindow messages={mockMessages} currentUserId="user123" />
    );

    const scrollable = container.querySelector('[role="list"]');
    await waitFor(() => {
      expect(scrollable.scrollTop).toBeGreaterThan(0);
    });
  });

  it('should handle empty message list', () => {
    render(<ChatWindow messages={[]} currentUserId="user123" />);

    expect(screen.getByText(/no messages|empty/i)).toBeInTheDocument();
  });

  it('should display loading state', async () => {
    render(<ChatWindow messages={mockMessages} isLoading={true} currentUserId="user123" />);

    expect(screen.getByText(/loading|fetching/i)).toBeInTheDocument();
  });

  it('should handle message load errors', () => {
    render(
      <ChatWindow
        messages={[]}
        currentUserId="user123"
        error="Failed to load messages"
      />
    );

    expect(screen.getByText(/Failed to load messages/)).toBeInTheDocument();
  });

  it('should format timestamps correctly', async () => {
    render(<ChatWindow messages={mockMessages} currentUserId="user123" />);

    await waitFor(() => {
      // Should show time in 12/24 hour format
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    });
  });

  it('should have accessible message structure', async () => {
    render(<ChatWindow messages={mockMessages} currentUserId="user123" />);

    await waitFor(() => {
      const messageList = screen.getByRole('list');
      expect(messageList).toBeInTheDocument();
    });
  });

  it('should handle very long messages', async () => {
    const longMessage = {
      ...mockMessages[0],
      encryptedContent: 'A'.repeat(10000),
    };

    render(<ChatWindow messages={[longMessage]} currentUserId="user123" />);

    await waitFor(() => {
      expect(screen.getByText(/Decrypted:/)).toBeInTheDocument();
    });
  });
});

export default {};
