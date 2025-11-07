import express from 'express';
import { 
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateKeyPairSync } from 'crypto';
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';

const router = express.Router();

// Configuration
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';
const RP_NAME = process.env.RP_NAME || 'Secure Chat';

/**
 * POST /api/auth/register/options
 * Initiate WebAuthn registration - get challenge for new user
 * 
 * @body { username: string, email: string }
 * @returns { challenge, rp, user, pubKeyCredParams, timeout, attestation }
 */
router.post('/register/options', async (req, res) => {
  try {
    const { username, email } = req.body;

    // Validate input
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Generate WebAuthn challenge
    const options = await generateRegistrationOptions({
      rpID: RP_ID,
      rpName: RP_NAME,
      userID: Buffer.from(username + Date.now()), // Unique user ID
      userName: username,
      userDisplayName: username,
      attestationType: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        residentKey: 'preferred'
      },
      supportedAlgorithmIDs: [-7, -257] // ES256, RS256
    });

    // Store challenge in session (would use session store in production)
    // For now, we'll store in client and they send it back
    res.json({
      ...options,
      userId: username // Client stores this to send back
    });

  } catch (error) {
    console.error('Registration options error:', error);
    res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

/**
 * POST /api/auth/register/verify
 * Verify WebAuthn registration response and create user
 * 
 * @body { username, email, attestationResponse, challenge }
 * @returns { token, user }
 */
router.post('/register/verify', async (req, res) => {
  try {
    const { username, email, attestationResponse, challenge } = req.body;

    if (!username || !email || !attestationResponse || !challenge) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify attestation response
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge: challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: false
      });
    } catch (error) {
      console.error('Attestation verification failed:', error);
      return res.status(401).json({ error: 'WebAuthn verification failed' });
    }

    if (!verification.verified) {
      return res.status(401).json({ error: 'WebAuthn verification failed' });
    }

    // Generate NaCl key pair for E2E encryption
    const keyPair = nacl.box.keyPair();
    const publicKeyBase64 = encodeBase64(keyPair.publicKey);

    // Create new user
    const user = new User({
      username,
      email,
      publicKeyForEncryption: publicKeyBase64,
      webauthnCredentials: [{
        id: Buffer.from(verification.registrationInfo.credentialID).toString('base64'),
        publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64'),
        signCount: verification.registrationInfo.signCount,
        transports: attestationResponse.transports || []
      }]
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        publicKeyForEncryption: user.publicKeyForEncryption
      }
    });

  } catch (error) {
    console.error('Registration verification error:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({ error: 'User already exists' });
    }
    
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

/**
 * POST /api/auth/login/options
 * Initiate WebAuthn login - get challenge for existing user
 * 
 * @body { username: string }
 * @returns { challenge, allowCredentials, timeout, userVerification }
 */
router.post('/login/options', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    // Find user
    const user = await User.findOne({ username });
    
    if (!user) {
      // Don't reveal if user exists - send same response
      // Security: prevent user enumeration
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: user ? user.webauthnCredentials.map(cred => ({
        id: Buffer.from(cred.id, 'base64'),
        type: 'public-key',
        transports: cred.transports
      })) : []
    });

    res.json(options);

  } catch (error) {
    console.error('Login options error:', error);
    res.status(500).json({ error: 'Failed to generate login options' });
  }
});

/**
 * POST /api/auth/login/verify
 * Verify WebAuthn login response and issue JWT
 * 
 * @body { username, assertionResponse, challenge }
 * @returns { token, user }
 */
router.post('/login/verify', async (req, res) => {
  try {
    const { username, assertionResponse, challenge } = req.body;

    if (!username || !assertionResponse || !challenge) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find user
    const user = await User.findOne({ username });
    
    if (!user || user.webauthnCredentials.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find matching credential
    const credential = user.webauthnCredentials.find(
      cred => Buffer.from(assertionResponse.id, 'base64').toString('base64') === cred.id
    );

    if (!credential) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify assertion response
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: assertionResponse,
        expectedChallenge: challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: Buffer.from(credential.id, 'base64'),
          publicKey: Buffer.from(credential.publicKey, 'base64'),
          signCount: credential.signCount,
          transports: credential.transports
        }
      });
    } catch (error) {
      console.error('Assertion verification failed:', error);
      return res.status(401).json({ error: 'WebAuthn verification failed' });
    }

    if (!verification.verified) {
      return res.status(401).json({ error: 'WebAuthn verification failed' });
    }

    // Update sign count to detect cloned authenticators
    if (verification.authenticationInfo.signCount <= credential.signCount) {
      console.warn(`Possible cloned authenticator for user ${username}`);
      // Option 1: Reject login
      // return res.status(401).json({ error: 'Authenticator verification failed' });
      // Option 2: Allow but log warning
    }

    // Update last login and sign count
    credential.signCount = verification.authenticationInfo.signCount;
    user.lastLogin = new Date();
    user.status = 'online';
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        publicKeyForEncryption: user.publicKeyForEncryption
      }
    });

  } catch (error) {
    console.error('Login verification error:', error);
    res.status(500).json({ error: 'Failed to verify login' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (clear session)
 * 
 * @returns { message }
 */
router.post('/logout', (req, res) => {
  // JWT is stateless, so logout is client-side
  // However, we can mark user as offline
  res.json({ message: 'Logged out successfully' });
});

export default router;
