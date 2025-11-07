import { useCallback, useState, useEffect } from 'react';
import nacl from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';

/**
 * Custom hook for client-side NaCl encryption/decryption
 * Manages user's encryption key pair
 */
export function useCrypto() {
  const [keyPair, setKeyPair] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize or restore key pair
  useEffect(() => {
    const initializeKeys = async () => {
      try {
        // Check if key pair exists in session storage
        const savedSecretKey = sessionStorage.getItem('naCl_secretKey');

        if (savedSecretKey) {
          // Restore from session
          const secretKey = decodeBase64(savedSecretKey);
          const publicKey = nacl.box.keyPair.fromSecretKey(secretKey);
          setKeyPair({
            publicKey: publicKey.publicKey,
            secretKey: secretKey,
          });
        } else {
          // Generate new key pair
          const newKeyPair = nacl.box.keyPair();
          setKeyPair({
            publicKey: newKeyPair.publicKey,
            secretKey: newKeyPair.secretKey,
          });

          // Store secret key in session
          sessionStorage.setItem('naCl_secretKey', encodeBase64(newKeyPair.secretKey));
        }
      } catch (error) {
        console.error('Failed to initialize encryption keys:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeKeys();
  }, []);

  /**
   * Encrypt a message for a recipient
   * @param {string} message - Plain text message
   * @param {string} recipientPublicKeyB64 - Recipient's public key (base64)
   * @returns { encryptedContent, nonce }
   */
  const encryptMessage = useCallback((message, recipientPublicKeyB64) => {
    if (!keyPair) throw new Error('Encryption keys not initialized');

    try {
      const recipientPublicKey = decodeBase64(recipientPublicKeyB64);
      const messageBytes = nacl.util.decodeUTF8(message);
      const nonce = nacl.randomBytes(24);

      const encrypted = nacl.box(
        messageBytes,
        nonce,
        recipientPublicKey,
        keyPair.secretKey
      );

      return {
        encryptedContent: encodeBase64(encrypted),
        nonce: encodeBase64(nonce),
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }, [keyPair]);

  /**
   * Decrypt a message from a sender
   * @param {string} encryptedContentB64 - Encrypted content (base64)
   * @param {string} nonceB64 - Nonce (base64)
   * @param {string} senderPublicKeyB64 - Sender's public key (base64)
   * @returns {string} Decrypted plaintext
   */
  const decryptMessage = useCallback((encryptedContentB64, nonceB64, senderPublicKeyB64) => {
    if (!keyPair) throw new Error('Encryption keys not initialized');

    try {
      const encrypted = decodeBase64(encryptedContentB64);
      const nonce = decodeBase64(nonceB64);
      const senderPublicKey = decodeBase64(senderPublicKeyB64);

      const decrypted = nacl.box.open(
        encrypted,
        nonce,
        senderPublicKey,
        keyPair.secretKey
      );

      if (!decrypted) {
        throw new Error('Decryption failed - invalid credentials or tampered message');
      }

      return nacl.util.encodeUTF8(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt message');
    }
  }, [keyPair]);

  /**
   * Get public key in base64 format for sharing
   * @returns {string} Base64-encoded public key
   */
  const getPublicKeyB64 = useCallback(() => {
    if (!keyPair) return null;
    return encodeBase64(keyPair.publicKey);
  }, [keyPair]);

  /**
   * Clear keys from session (on logout)
   */
  const clearKeys = useCallback(() => {
    sessionStorage.removeItem('naCl_secretKey');
    setKeyPair(null);
  }, []);

  return {
    keyPair,
    loading,
    encryptMessage,
    decryptMessage,
    getPublicKeyB64,
    clearKeys,
  };
}
