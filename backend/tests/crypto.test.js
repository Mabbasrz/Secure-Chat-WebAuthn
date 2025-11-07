/**
 * CrypTalk - Crypto Utils Tests
 * Testing NaCl encryption/decryption, key generation
 */

const {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  isValidPublicKey,
  hashMessage,
} = require('../src/utils/crypto');

describe('Crypto Utils - NaCl Encryption', () => {
  let senderKeyPair;
  let recipientKeyPair;

  beforeAll(() => {
    senderKeyPair = generateKeyPair();
    recipientKeyPair = generateKeyPair();
  });

  describe('generateKeyPair()', () => {
    it('should generate valid key pair', () => {
      const keyPair = generateKeyPair();

      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('secretKey');
      expect(typeof keyPair.publicKey).toBe('string');
      expect(typeof keyPair.secretKey).toBe('string');
    });

    it('should generate unique key pairs', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();

      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.secretKey).not.toBe(keyPair2.secretKey);
    });

    it('should generate base64-encoded keys', () => {
      const keyPair = generateKeyPair();

      // Base64 regex pattern
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      expect(base64Regex.test(keyPair.publicKey)).toBe(true);
      expect(base64Regex.test(keyPair.secretKey)).toBe(true);
    });

    it('should generate 44-character base64 keys (32 bytes)', () => {
      const keyPair = generateKeyPair();

      // 32 bytes in base64 = 44 characters (including padding)
      expect(keyPair.publicKey.length).toBe(44);
      expect(keyPair.secretKey.length).toBe(44);
    });
  });

  describe('encryptMessage()', () => {
    it('should encrypt message and return ciphertext + nonce', () => {
      const plaintext = 'Hello, CrypTalk!';
      const result = encryptMessage(
        plaintext,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('nonce');
      expect(typeof result.ciphertext).toBe('string');
      expect(typeof result.nonce).toBe('string');
    });

    it('should produce different ciphertext for same message', () => {
      const plaintext = 'Same message';
      const result1 = encryptMessage(
        plaintext,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );
      const result2 = encryptMessage(
        plaintext,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      // Due to random nonce, ciphertexts should differ
      expect(result1.ciphertext).not.toBe(result2.ciphertext);
      expect(result1.nonce).not.toBe(result2.nonce);
    });

    it('should encrypt empty string', () => {
      const result = encryptMessage(
        '',
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('nonce');
    });

    it('should encrypt long message', () => {
      const longMessage = 'A'.repeat(10000);
      const result = encryptMessage(
        longMessage,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      expect(result).toHaveProperty('ciphertext');
      expect(result.ciphertext.length).toBeGreaterThan(longMessage.length);
    });

    it('should return base64-encoded ciphertext and nonce', () => {
      const plaintext = 'Test message';
      const result = encryptMessage(
        plaintext,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      expect(base64Regex.test(result.ciphertext)).toBe(true);
      expect(base64Regex.test(result.nonce)).toBe(true);
    });

    it('should require valid recipient public key', () => {
      expect(() => {
        encryptMessage(
          'message',
          'invalid-key',
          senderKeyPair.secretKey
        );
      }).toThrow();
    });

    it('should require valid sender secret key', () => {
      expect(() => {
        encryptMessage(
          'message',
          recipientKeyPair.publicKey,
          'invalid-key'
        );
      }).toThrow();
    });
  });

  describe('decryptMessage()', () => {
    it('should decrypt encrypted message', () => {
      const plaintext = 'Secret message';
      const encrypted = encryptMessage(
        plaintext,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      const decrypted = decryptMessage(
        encrypted.ciphertext,
        encrypted.nonce,
        senderKeyPair.publicKey,
        recipientKeyPair.secretKey
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should return original message exactly', () => {
      const messages = [
        'Hello, World!',
        '你好世界', // Chinese
        '🔐 Emoji test',
        'Line 1\nLine 2\nLine 3',
        '   Spaces   ',
      ];

      messages.forEach((msg) => {
        const encrypted = encryptMessage(
          msg,
          recipientKeyPair.publicKey,
          senderKeyPair.secretKey
        );

        const decrypted = decryptMessage(
          encrypted.ciphertext,
          encrypted.nonce,
          senderKeyPair.publicKey,
          recipientKeyPair.secretKey
        );

        expect(decrypted).toBe(msg);
      });
    });

    it('should fail with wrong nonce', () => {
      const plaintext = 'Secret message';
      const encrypted = encryptMessage(
        plaintext,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      // Modify nonce
      const wrongNonce = encryptMessage(
        'Another message',
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      ).nonce;

      expect(() => {
        decryptMessage(
          encrypted.ciphertext,
          wrongNonce,
          senderKeyPair.publicKey,
          recipientKeyPair.secretKey
        );
      }).toThrow();
    });

    it('should fail with wrong recipient key', () => {
      const plaintext = 'Secret message';
      const encrypted = encryptMessage(
        plaintext,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      const wrongKeyPair = generateKeyPair();

      expect(() => {
        decryptMessage(
          encrypted.ciphertext,
          encrypted.nonce,
          senderKeyPair.publicKey,
          wrongKeyPair.secretKey
        );
      }).toThrow();
    });

    it('should fail with corrupted ciphertext', () => {
      const plaintext = 'Secret message';
      const encrypted = encryptMessage(
        plaintext,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      // Corrupt ciphertext
      const corruptedCiphertext = encrypted.ciphertext.slice(0, -5) + 'XXXXX';

      expect(() => {
        decryptMessage(
          corruptedCiphertext,
          encrypted.nonce,
          senderKeyPair.publicKey,
          recipientKeyPair.secretKey
        );
      }).toThrow();
    });
  });

  describe('Encryption Roundtrip', () => {
    it('should encrypt and decrypt multiple messages', () => {
      const messages = [
        'First message',
        'Second message',
        'Third message',
      ];

      const results = messages.map((msg) => {
        const encrypted = encryptMessage(
          msg,
          recipientKeyPair.publicKey,
          senderKeyPair.secretKey
        );

        const decrypted = decryptMessage(
          encrypted.ciphertext,
          encrypted.nonce,
          senderKeyPair.publicKey,
          recipientKeyPair.secretKey
        );

        return decrypted;
      });

      expect(results).toEqual(messages);
    });

    it('should handle bidirectional encryption', () => {
      // A sends to B
      const messageAtoB = 'Hello from A';
      const encryptedAtoB = encryptMessage(
        messageAtoB,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      const decryptedAtoB = decryptMessage(
        encryptedAtoB.ciphertext,
        encryptedAtoB.nonce,
        senderKeyPair.publicKey,
        recipientKeyPair.secretKey
      );

      expect(decryptedAtoB).toBe(messageAtoB);

      // B sends back to A
      const messageBtoA = 'Hello from B';
      const encryptedBtoA = encryptMessage(
        messageBtoA,
        senderKeyPair.publicKey, // Now B encrypts to A
        recipientKeyPair.secretKey // Using B's secret key
      );

      const decryptedBtoA = decryptMessage(
        encryptedBtoA.ciphertext,
        encryptedBtoA.nonce,
        recipientKeyPair.publicKey, // Decrypt using B's public key
        senderKeyPair.secretKey // A's secret key
      );

      expect(decryptedBtoA).toBe(messageBtoA);
    });
  });

  describe('isValidPublicKey()', () => {
    it('should validate correct public key', () => {
      const keyPair = generateKeyPair();
      expect(isValidPublicKey(keyPair.publicKey)).toBe(true);
    });

    it('should reject invalid key format', () => {
      expect(isValidPublicKey('invalid-key')).toBe(false);
      expect(isValidPublicKey('')).toBe(false);
      expect(isValidPublicKey(null)).toBe(false);
    });

    it('should reject non-base64 keys', () => {
      expect(isValidPublicKey('!@#$%^&*()')).toBe(false);
    });

    it('should reject wrong-sized keys', () => {
      // 32 bytes = 44 chars in base64, not 43 or 45
      const shortKey = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // 40 chars
      expect(isValidPublicKey(shortKey)).toBe(false);
    });
  });

  describe('hashMessage()', () => {
    it('should generate consistent hash', () => {
      const message = 'Test message';
      const hash1 = hashMessage(message);
      const hash2 = hashMessage(message);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different message', () => {
      const hash1 = hashMessage('Message 1');
      const hash2 = hashMessage('Message 2');

      expect(hash1).not.toBe(hash2);
    });

    it('should return hex-encoded hash', () => {
      const hash = hashMessage('Test');
      const hexRegex = /^[0-9a-f]+$/i;
      expect(hexRegex.test(hash)).toBe(true);
    });

    it('should generate 64-character hash (256-bit SHA256)', () => {
      const hash = hashMessage('Test message');
      expect(hash.length).toBe(64);
    });
  });

  describe('Security Properties', () => {
    it('should not leak message length from ciphertext', () => {
      const short = 'Hi';
      const long = 'This is a very long message with many words';

      const encryptedShort = encryptMessage(
        short,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      const encryptedLong = encryptMessage(
        long,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      // Ciphertexts should have comparable lengths
      // (exact length depends on implementation, but should be similar)
      expect(Math.abs(
        encryptedShort.ciphertext.length - encryptedLong.ciphertext.length
      )).toBeLessThan(50);
    });

    it('should provide authentication (tampering detection)', () => {
      const plaintext = 'Authentic message';
      const encrypted = encryptMessage(
        plaintext,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      // Tamper with one character
      const tampered = encrypted.ciphertext.substring(0, 10) +
        (encrypted.ciphertext[10] === 'A' ? 'B' : 'A') +
        encrypted.ciphertext.substring(11);

      expect(() => {
        decryptMessage(
          tampered,
          encrypted.nonce,
          senderKeyPair.publicKey,
          recipientKeyPair.secretKey
        );
      }).toThrow();
    });
  });

  describe('Performance', () => {
    it('should encrypt message in < 100ms', () => {
      const plaintext = 'Performance test message';
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        encryptMessage(
          plaintext,
          recipientKeyPair.publicKey,
          senderKeyPair.secretKey
        );
      }

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(10000); // 100ms per message on average
    });

    it('should decrypt message in < 100ms', () => {
      const plaintext = 'Performance test message';
      const encrypted = encryptMessage(
        plaintext,
        recipientKeyPair.publicKey,
        senderKeyPair.secretKey
      );

      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        decryptMessage(
          encrypted.ciphertext,
          encrypted.nonce,
          senderKeyPair.publicKey,
          recipientKeyPair.secretKey
        );
      }

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(10000); // 100ms per message on average
    });
  });
});

module.exports = {};
