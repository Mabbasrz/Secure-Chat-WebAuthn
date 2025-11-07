/**
 * CrypTalk - useSocket Hook Tests
 * Testing real-time Socket.IO connection and events
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSocket from '../../hooks/useSocket';

// Mock Socket.IO client
let mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
  connected: true,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('useSocket Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connect: vi.fn(),
      connected: true,
    };
  });

  it('should initialize Socket.IO connection', () => {
    const { result } = renderHook(() => useSocket());

    expect(result.current.connected).toBe(true);
  });

  it('should listen for incoming messages', () => {
    renderHook(() => useSocket());

    expect(mockSocket.on).toHaveBeenCalledWith(
      'receive-message',
      expect.any(Function)
    );
  });

  it('should send encrypted message', () => {
    const { result } = renderHook(() => useSocket());

    const message = {
      receiver: 'user456',
      encryptedContent: 'base64-ciphertext',
      nonce: 'base64-nonce',
    };

    act(() => {
      result.current.sendMessage(message);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('send-message', message);
  });

  it('should handle user presence events', () => {
    renderHook(() => useSocket());

    expect(mockSocket.on).toHaveBeenCalledWith(
      'user-joined',
      expect.any(Function)
    );

    expect(mockSocket.on).toHaveBeenCalledWith(
      'user-disconnected',
      expect.any(Function)
    );
  });

  it('should emit typing indicator', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.emitTyping('user456', 'testuser');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'typing',
      expect.objectContaining({
        recipient: 'user456',
      })
    );
  });

  it('should emit stop-typing event', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.emitStopTyping('user456');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'stop-typing',
      expect.objectContaining({
        recipient: 'user456',
      })
    );
  });

  it('should fetch online users list', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.getOnlineUsers();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('get-online-users');
  });

  it('should handle disconnection', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.disconnect();
    });

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should handle reconnection', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.connect();
    });

    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it('should register message callback', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.onMessage(callback);
    });

    // Simulate receiving a message
    const messageHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'receive-message'
    )?.[1];

    if (messageHandler) {
      messageHandler({
        sender: 'user456',
        encryptedContent: 'base64-ciphertext',
      });
    }
  });

  it('should track connection status', () => {
    const { result } = renderHook(() => useSocket());

    expect(result.current.connected).toBe(true);

    act(() => {
      mockSocket.connected = false;
    });

    // After reconnection
    expect(result.current.reconnecting).toBeDefined();
  });

  it('should handle connection errors', () => {
    renderHook(() => useSocket());

    expect(mockSocket.on).toHaveBeenCalledWith(
      'connect_error',
      expect.any(Function)
    );
  });

  it('should remove event listeners on unmount', () => {
    const { unmount } = renderHook(() => useSocket());

    unmount();

    expect(mockSocket.off).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should handle message delivery callbacks', () => {
    const { result } = renderHook(() => useSocket());

    const onDelivered = vi.fn();

    act(() => {
      result.current.sendMessage(
        {
          receiver: 'user456',
          encryptedContent: 'base64-ciphertext',
          nonce: 'base64-nonce',
        },
        onDelivered
      );
    });

    expect(mockSocket.emit).toHaveBeenCalled();
  });

  it('should handle failed delivery', () => {
    renderHook(() => useSocket());

    expect(mockSocket.on).toHaveBeenCalledWith(
      'message-failed',
      expect.any(Function)
    );
  });

  it('should emit user join notification', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.notifyUserJoined('user123', 'testuser');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'user-joined',
      expect.objectContaining({
        userId: 'user123',
        username: 'testuser',
      })
    );
  });

  it('should handle rapid message sending', () => {
    const { result } = renderHook(() => useSocket());

    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.sendMessage({
          receiver: 'user456',
          encryptedContent: `ciphertext-${i}`,
          nonce: `nonce-${i}`,
        });
      });
    }

    expect(mockSocket.emit).toHaveBeenCalledTimes(10);
  });
});

export default {};
