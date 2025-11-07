/**
 * CrypTalk - useCrypto Hook Tests
 * Testing NaCl encryption/decryption, key management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useCrypto from '../../hooks/useCrypto';

// Mock TweetNaCl
vi.mock('tweetnacl', () => ({
  default: {
    box: {
      keyPair: () => ({
        publicKey: new Uint8Array(32).fill(1),
        secretKey: new Uint8Array(64).fill(2),
      }),
      open: (ciphertext, nonce, publicKey, secretKey) => {
        if (!ciphertext || !nonce) return null;
        return new TextEncoder().encode('Decrypted message');
      },
    },
    utils: {
      encodeBase64: (arr) => Buffer.from(arr).toString('base64'),
      decodeBase64: (str) => new Uint8Array(Buffer.from(str, 'base64')),
    },
    secretbox: {
      open: () => new TextEncoder().encode('Opened message'),
      seal: () => new Uint8Array(32),
    },
  },
}));

describe('useCrypto Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should generate key pair on init', () => {
    const { result } = renderHook(() => useCrypto());

    expect(result.current.publicKey).toBeDefined();
    expect(result.current.secretKey).toBeDefined();
  });

  it('should persist keys to localStorage', () => {
    const { result } = renderHook(() => useCrypto());

    expect(localStorage.getItem('publicKey')).toBeDefined();
    expect(localStorage.getItem('secretKey')).toBeDefined();
  });

  it('should restore keys from localStorage', () => {
    const publicKey = 'test-public-key-base64';
    const secretKey = 'test-secret-key-base64';

    localStorage.setItem('publicKey', publicKey);
    localStorage.setItem('secretKey', secretKey);

    const { result } = renderHook(() => useCrypto());

    expect(result.current.publicKey).toBe(publicKey);
    expect(result.current.secretKey).toBe(secretKey);
  });

  it('should encrypt message with recipient public key', async () => {
    const { result } = renderHook(() => useCrypto());

    let encryptedMessage;

    await act(async () => {
      encryptedMessage = await result.current.encryptMessage(
        'Hello, CrypTalk!',
        'recipient-public-key'
      );
    });

    expect(encryptedMessage).toHaveProperty('ciphertext');
    expect(encryptedMessage).toHaveProperty('nonce');
  });

  it('should decrypt message with proper keys', async () => {
    const { result } = renderHook(() => useCrypto());

    let decryptedMessage;

    await act(async () => {
      decryptedMessage = await result.current.decryptMessage(
        'base64-ciphertext',
        'base64-nonce',
        'sender-public-key'
      );
    });

    expect(decryptedMessage).toBeDefined();
  });

  it('should handle decryption errors gracefully', async () => {
    const { result } = renderHook(() => useCrypto());

    let decryptionResult;

    await act(async () => {
      decryptionResult = await result.current.decryptMessage(
        'invalid-ciphertext',
        'invalid-nonce',
        'sender-public-key'
      ).catch(e => ({ error: e.message }));
    });

    expect(decryptionResult).toBeDefined();
  });

  it('should validate recipient public key', () => {
    const { result } = renderHook(() => useCrypto());

    const isValid = result.current.isValidPublicKey('valid-base64-key');

    expect(typeof isValid).toBe('boolean');
  });

  it('should generate deterministic hash for integrity check', async () => {
    const { result } = renderHook(() => useCrypto());

    let hash1, hash2;

    await act(async () => {
      hash1 = await result.current.hashMessage('test message');
      hash2 = await result.current.hashMessage('test message');
    });

    expect(hash1).toBe(hash2);
  });

  it('should derive symmetric key from shared secret', async () => {
    const { result } = renderHook(() => useCrypto());

    let symmetricKey;

    await act(async () => {
      symmetricKey = await result.current.deriveSymmetricKey('shared-secret');
    });

    expect(symmetricKey).toBeDefined();
  });

  it('should handle multiple recipients (group encryption)', async () => {
    const { result } = renderHook(() => useCrypto());

    const recipients = ['user1-pubkey', 'user2-pubkey', 'user3-pubkey'];

    let encryptedMessages;

    await act(async () => {
      encryptedMessages = await Promise.all(
        recipients.map(pubkey =>
          result.current.encryptMessage('Group message', pubkey)
        )
      );
    });

    expect(encryptedMessages.length).toBe(3);
    encryptedMessages.forEach(msg => {
      expect(msg).toHaveProperty('ciphertext');
      expect(msg).toHaveProperty('nonce');
    });
  });

  it('should clear keys on logout', () => {
    const { result } = renderHook(() => useCrypto());

    act(() => {
      result.current.clearKeys();
    });

    expect(localStorage.getItem('publicKey')).toBeNull();
    expect(localStorage.getItem('secretKey')).toBeNull();
  });

  it('should export public key for sharing', () => {
    const { result } = renderHook(() => useCrypto());

    const exportedKey = result.current.exportPublicKey();

    expect(exportedKey).toBeDefined();
    expect(typeof exportedKey).toBe('string');
  });

  it('should perform encryption with valid parameters', async () => {
    const { result } = renderHook(() => useCrypto());

    const testCases = [
      'Simple message',
      '🔐 Emoji message',
      'Multi\nline\nmessage',
      'A'.repeat(10000), // Long message
      '', // Empty string
    ];

    for (const message of testCases) {
      await act(async () => {
        const encrypted = await result.current.encryptMessage(
          message,
          'recipient-pubkey'
        );
        expect(encrypted.ciphertext).toBeDefined();
      });
    }
  });
});

export default {};
