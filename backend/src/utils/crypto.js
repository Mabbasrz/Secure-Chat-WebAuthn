import nacl from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';

/**
 * Encryption utility functions for NaCl (libsodium)
 * Used for end-to-end encryption of messages
 */

/**
 * Generate a new NaCl key pair for box (public-key cryptography)
 * @returns { publicKey: base64, secretKey: base64 }
 */
export function generateKeyPair() {
  const keyPair = nacl.box.keyPair();
  
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey)
  };
}

/**
 * Encrypt a message with recipient's public key
 * Uses sender's secret key to create authenticated encryption
 * 
 * @param {string} message - Plain text message
 * @param {string} recipientPublicKeyB64 - Recipient's public key (base64)
 * @param {string} senderSecretKeyB64 - Sender's secret key (base64)
 * @returns { encryptedContent: base64, nonce: base64 }
 */
export function encryptMessage(message, recipientPublicKeyB64, senderSecretKeyB64) {
  try {
    // Decode base64 keys
    const recipientPublicKey = decodeBase64(recipientPublicKeyB64);
    const senderSecretKey = decodeBase64(senderSecretKeyB64);

    // Convert message to bytes
    const messageBytes = nacl.util.decodeUTF8(message);

    // Generate random nonce (24 bytes)
    const nonce = nacl.randomBytes(24);

    // Encrypt message
    const encrypted = nacl.box(
      messageBytes,
      nonce,
      recipientPublicKey,
      senderSecretKey
    );

    return {
      encryptedContent: encodeBase64(encrypted),
      nonce: encodeBase64(nonce)
    };

  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt a message with recipient's secret key
 * 
 * @param {string} encryptedContentB64 - Encrypted message (base64)
 * @param {string} nonceB64 - Nonce used for encryption (base64)
 * @param {string} senderPublicKeyB64 - Sender's public key (base64)
 * @param {string} recipientSecretKeyB64 - Recipient's secret key (base64)
 * @returns {string} Decrypted plaintext message
 */
export function decryptMessage(encryptedContentB64, nonceB64, senderPublicKeyB64, recipientSecretKeyB64) {
  try {
    // Decode base64
    const encrypted = decodeBase64(encryptedContentB64);
    const nonce = decodeBase64(nonceB64);
    const senderPublicKey = decodeBase64(senderPublicKeyB64);
    const recipientSecretKey = decodeBase64(recipientSecretKeyB64);

    // Decrypt message
    const decrypted = nacl.box.open(
      encrypted,
      nonce,
      senderPublicKey,
      recipientSecretKey
    );

    if (!decrypted) {
      throw new Error('Decryption failed - authentication tag verification failed');
    }

    // Convert bytes to UTF-8 string
    return nacl.util.encodeUTF8(decrypted);

  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Verify that a public key is valid (can be parsed)
 * @param {string} publicKeyB64 - Public key (base64)
 * @returns {boolean}
 */
export function isValidPublicKey(publicKeyB64) {
  try {
    const key = decodeBase64(publicKeyB64);
    return key.length === 32; // NaCl public keys are 32 bytes
  } catch {
    return false;
  }
}

/**
 * Hash a message (for integrity checking, not encryption)
 * @param {string} message
 * @returns {string} Hash in base64
 */
export function hashMessage(message) {
  const messageBytes = nacl.util.decodeUTF8(message);
  const hash = nacl.hash(messageBytes);
  return encodeBase64(hash);
}

/**
 * Server-side encryption utilities (for at-rest encryption if needed)
 * Note: In this app, messages are not encrypted server-side (client-side only)
 * These functions are provided for future use
 */

/**
 * Generate a symmetric key for server-side encryption (if needed)
 * @returns {string} 32-byte key (base64)
 */
export function generateSymmetricKey() {
  const key = nacl.randomBytes(32);
  return encodeBase64(key);
}

/**
 * Encrypt with symmetric key (for at-rest encryption)
 * @param {string} plaintext
 * @param {string} keyB64
 * @returns { encryptedContent: base64, nonce: base64 }
 */
export function encryptSymmetric(plaintext, keyB64) {
  try {
    const key = decodeBase64(keyB64);
    const nonce = nacl.randomBytes(24);
    const plaintextBytes = nacl.util.decodeUTF8(plaintext);

    const encrypted = nacl.secretbox(plaintextBytes, nonce, key);

    return {
      encryptedContent: encodeBase64(encrypted),
      nonce: encodeBase64(nonce)
    };
  } catch (error) {
    throw new Error(`Symmetric encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt with symmetric key
 * @param {string} encryptedContentB64
 * @param {string} nonceB64
 * @param {string} keyB64
 * @returns {string} Decrypted plaintext
 */
export function decryptSymmetric(encryptedContentB64, nonceB64, keyB64) {
  try {
    const encrypted = decodeBase64(encryptedContentB64);
    const nonce = decodeBase64(nonceB64);
    const key = decodeBase64(keyB64);

    const decrypted = nacl.secretbox.open(encrypted, nonce, key);

    if (!decrypted) {
      throw new Error('Symmetric decryption failed');
    }

    return nacl.util.encodeUTF8(decrypted);
  } catch (error) {
    throw new Error(`Symmetric decryption failed: ${error.message}`);
  }
}

export default {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  isValidPublicKey,
  hashMessage,
  generateSymmetricKey,
  encryptSymmetric,
  decryptSymmetric
};
