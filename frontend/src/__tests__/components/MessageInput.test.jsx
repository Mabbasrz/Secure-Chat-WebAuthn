/**
 * CrypTalk - MessageInput Component Tests
 * Testing encrypted message input and sending
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from '../../components/MessageInput';

// Mock useCrypto hook
vi.mock('../../hooks/useCrypto', () => ({
  default: () => ({
    encryptMessage: vi.fn(async (msg) => ({
      encryptedContent: 'base64-ciphertext',
      nonce: 'base64-nonce',
    })),
    recipientPublicKey: 'test-public-key',
  }),
}));

describe('MessageInput Component', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
    vi.clearAllMocks();
  });

  it('should render message input field', () => {
    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={false}
      />
    );

    expect(screen.getByPlaceholderText(/type message|enter message/i)).toBeInTheDocument();
  });

  it('should send message on Enter key', async () => {
    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={false}
      />
    );

    const input = screen.getByPlaceholderText(/type message|enter message/i);
    await userEvent.type(input, 'Hello, CrypTalk!');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnSend).toHaveBeenCalled();
  });

  it('should not send empty messages', async () => {
    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={false}
      />
    );

    const input = screen.getByPlaceholderText(/type message|enter message/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should allow multiline input', async () => {
    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={false}
      />
    );

    const input = screen.getByPlaceholderText(/type message|enter message/i);
    await userEvent.type(input, 'Line 1\nLine 2');

    expect(input.value).toContain('\n');
  });

  it('should encrypt message before sending', async () => {
    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={false}
      />
    );

    const input = screen.getByPlaceholderText(/type message|enter message/i);
    await userEvent.type(input, 'Secret message');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnSend).toHaveBeenCalledWith(
      expect.objectContaining({
        encryptedContent: 'base64-ciphertext',
        nonce: 'base64-nonce',
      })
    );
  });

  it('should clear input after sending', async () => {
    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={false}
      />
    );

    const input = screen.getByPlaceholderText(/type message|enter message/i);
    await userEvent.type(input, 'Test message');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(input.value).toBe('');
  });

  it('should disable input when disabled prop is true', () => {
    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={true}
      />
    );

    const input = screen.getByPlaceholderText(/type message|enter message/i);
    expect(input).toBeDisabled();
  });

  it('should show loading state while sending', async () => {
    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={false}
        isLoading={true}
      />
    );

    expect(screen.getByRole('button', { name: /loading|sending/i })).toBeInTheDocument();
  });

  it('should emit typing event', async () => {
    const mockOnTyping = vi.fn();

    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={false}
        onTyping={mockOnTyping}
      />
    );

    const input = screen.getByPlaceholderText(/type message|enter message/i);
    await userEvent.type(input, 'T');

    expect(mockOnTyping).toHaveBeenCalled();
  });

  it('should not send on Shift+Enter', async () => {
    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={false}
      />
    );

    const input = screen.getByPlaceholderText(/type message|enter message/i);
    await userEvent.type(input, 'New line');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should handle emoji in messages', async () => {
    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={false}
      />
    );

    const input = screen.getByPlaceholderText(/type message|enter message/i);
    await userEvent.type(input, '🔐 Secure 🚀');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnSend).toHaveBeenCalledWith(
      expect.objectContaining({
        encryptedContent: 'base64-ciphertext',
      })
    );
  });

  it('should have send button', () => {
    render(
      <MessageInput
        onSend={mockOnSend}
        recipientId="user456"
        disabled={false}
      />
    );

    expect(screen.getByRole('button', { name: /send|submit/i })).toBeInTheDocument();
  });
});

export default {};
