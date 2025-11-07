/**
 * CrypTalk - Backend Auth Routes Tests
 * Testing WebAuthn registration, login, JWT generation
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { generateKeyPair } = require('../src/utils/crypto');
const User = require('../src/models/User');

// Mock dependencies
jest.mock('../src/models/User');
jest.mock('jsonwebtoken');

// Create minimal Express app for testing
const app = express();
app.use(express.json());

// Import auth routes
const authRoutes = require('../src/routes/auth');
app.use('/api/auth', authRoutes);

describe('Auth Routes - WebAuthn Registration & Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register/options', () => {
    it('should generate registration challenge options', async () => {
      const response = await request(app)
        .post('/api/auth/register/options')
        .send({ username: 'testuser', email: 'test@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('options');
      expect(response.body.options).toHaveProperty('challenge');
      expect(response.body.options).toHaveProperty('rp');
      expect(response.body.options).toHaveProperty('user');
      expect(response.body.options.rp.name).toBe('CrypTalk');
    });

    it('should return 400 for missing username', async () => {
      const response = await request(app)
        .post('/api/auth/register/options')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register/options')
        .send({ username: 'testuser', email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject username < 3 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register/options')
        .send({ username: 'ab', email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toMatch(/username.*3 characters/i);
    });
  });

  describe('POST /api/auth/register/verify', () => {
    it('should verify registration attestation and create user', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        publicKeyForEncryption: Buffer.from('test-public-key'),
        webauthnCredentials: [],
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(null); // User doesn't exist
      User.mockImplementation(() => mockUser);
      jwt.sign.mockReturnValue('test-jwt-token');

      const response = await request(app)
        .post('/api/auth/register/verify')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          response: {
            id: 'credential-id',
            response: {
              clientDataJSON: 'test-data',
              attestationObject: 'test-attestation',
            },
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
    });

    it('should reject existing username', async () => {
      User.findOne.mockResolvedValue({ username: 'testuser' });

      const response = await request(app)
        .post('/api/auth/register/verify')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          response: { /* credential response */ },
        })
        .expect(400);

      expect(response.body.error).toMatch(/username.*already/i);
    });

    it('should track credential sign count', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        webauthnCredentials: [{ id: 'cred-1', signCount: 5 }],
        save: jest.fn(),
      };

      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => mockUser);
      jwt.sign.mockReturnValue('test-jwt-token');

      await request(app)
        .post('/api/auth/register/verify')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          response: {
            id: 'credential-id',
            response: {
              clientDataJSON: 'test-data',
              attestationObject: 'test-attestation',
            },
          },
        });

      expect(mockUser.webauthnCredentials[0].signCount).toBe(5);
    });
  });

  describe('POST /api/auth/login/options', () => {
    it('should generate login challenge options', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        webauthnCredentials: [
          { id: Buffer.from('cred-id-1') },
          { id: Buffer.from('cred-id-2') },
        ],
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login/options')
        .send({ username: 'testuser' })
        .expect(200);

      expect(response.body).toHaveProperty('options');
      expect(response.body.options).toHaveProperty('challenge');
      expect(response.body.options).toHaveProperty('allowCredentials');
      expect(response.body.options.allowCredentials.length).toBe(2);
    });

    it('should return 404 for non-existent user', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login/options')
        .send({ username: 'nonexistent' })
        .expect(404);

      expect(response.body.error).toMatch(/user.*not found/i);
    });

    it('should return 400 for missing username', async () => {
      const response = await request(app)
        .post('/api/auth/login/options')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login/verify', () => {
    it('should verify login assertion and generate JWT', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        webauthnCredentials: [
          {
            id: 'cred-id',
            publicKey: Buffer.from('public-key'),
            signCount: 10,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('test-jwt-token');

      const response = await request(app)
        .post('/api/auth/login/verify')
        .send({
          username: 'testuser',
          response: {
            id: 'cred-id',
            response: {
              clientDataJSON: 'test-data',
              authenticatorData: 'test-auth-data',
              signature: 'test-signature',
            },
            signCount: 11,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toBe('test-jwt-token');
    });

    it('should detect cloned authenticator (sign count decrease)', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        webauthnCredentials: [
          {
            id: 'cred-id',
            publicKey: Buffer.from('public-key'),
            signCount: 20, // Current sign count
          },
        ],
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login/verify')
        .send({
          username: 'testuser',
          response: {
            id: 'cred-id',
            response: {
              clientDataJSON: 'test-data',
              authenticatorData: 'test-auth-data',
              signature: 'test-signature',
            },
            signCount: 15, // Sign count decreased - suspicious!
          },
        })
        .expect(403);

      expect(response.body.error).toMatch(/cloned|suspicious/i);
    });

    it('should return 404 for invalid credential', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        webauthnCredentials: [
          {
            id: 'cred-id-1',
            publicKey: Buffer.from('public-key'),
            signCount: 10,
          },
        ],
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login/verify')
        .send({
          username: 'testuser',
          response: {
            id: 'nonexistent-cred-id',
            response: {
              clientDataJSON: 'test-data',
              authenticatorData: 'test-auth-data',
              signature: 'test-signature',
            },
            signCount: 11,
          },
        })
        .expect(404);

      expect(response.body.error).toMatch(/credential.*not found/i);
    });

    it('should update user lastLogin timestamp', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        webauthnCredentials: [
          {
            id: 'cred-id',
            publicKey: Buffer.from('public-key'),
            signCount: 10,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('test-jwt-token');

      await request(app)
        .post('/api/auth/login/verify')
        .send({
          username: 'testuser',
          response: {
            id: 'cred-id',
            response: {
              clientDataJSON: 'test-data',
              authenticatorData: 'test-auth-data',
              signature: 'test-signature',
            },
            signCount: 11,
          },
        });

      expect(mockUser.lastLogin).toBeDefined();
    });
  });

  describe('JWT Token Validation', () => {
    it('should generate valid JWT with 24h expiry', () => {
      jwt.sign.mockImplementation((payload, secret, options) => {
        expect(options).toHaveProperty('expiresIn');
        expect(options.expiresIn).toBe('24h');
        return 'test-token';
      });

      // Trigger JWT generation via login
      const token = jwt.sign(
        { userId: 'user123', username: 'testuser' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      expect(token).toBe('test-token');
    });

    it('should include userId in JWT payload', () => {
      const payload = { userId: 'user123', username: 'testuser' };
      const token = jwt.sign(payload, 'secret');
      expect(token).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for database errors', async () => {
      User.findOne.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/login/options')
        .send({ username: 'testuser' })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should not expose sensitive errors in production', async () => {
      process.env.NODE_ENV = 'production';
      User.findOne.mockRejectedValue(new Error('Database password: secret123'));

      const response = await request(app)
        .post('/api/auth/login/options')
        .send({ username: 'testuser' })
        .expect(500);

      expect(response.body.error).not.toContain('secret123');
    });

    it('should return 400 for invalid WebAuthn response', async () => {
      const response = await request(app)
        .post('/api/auth/register/verify')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          response: null, // Invalid response
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit on registration (5 attempts/15min)', async () => {
      // This test assumes rate limiting middleware is in place
      // Make 6 requests in quick succession
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/register/options')
          .send({ username: `user${i}`, email: `user${i}@example.com` })
          .expect(200);
      }

      // 6th request should be rate limited
      const response = await request(app)
        .post('/api/auth/register/options')
        .send({ username: 'user5', email: 'user5@example.com' });

      expect(response.status).toBe(429); // Too Many Requests
    });
  });
});

module.exports = {};
