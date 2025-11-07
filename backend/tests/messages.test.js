/**
 * CrypTalk - Backend Messages Routes Tests
 * Testing message CRUD, pagination, encryption, soft-delete
 */

const request = require('supertest');
const express = require('express');
const Message = require('../src/models/Message');
const User = require('../src/models/User');

// Mock dependencies
jest.mock('../src/models/Message');
jest.mock('../src/models/User');

// Create minimal Express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { _id: 'user123', username: 'testuser' };
  next();
});

// Import message routes
const messageRoutes = require('../src/routes/messages');
app.use('/api/messages', messageRoutes);

describe('Message Routes - CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/messages - Create Message', () => {
    it('should create encrypted message', async () => {
      const mockMessage = {
        _id: 'msg123',
        sender: 'user123',
        receiver: 'user456',
        encryptedContent: 'base64-ciphertext',
        nonce: 'base64-nonce',
        isRead: false,
        deleted: false,
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      Message.mockImplementation(() => mockMessage);

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', 'Bearer test-token')
        .send({
          receiver: 'user456',
          encryptedContent: 'base64-ciphertext',
          nonce: 'base64-nonce',
        })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message.sender).toBe('user123');
      expect(response.body.message.encryptedContent).toBe('base64-ciphertext');
    });

    it('should reject message > 1MB', async () => {
      const largeContent = 'A'.repeat(1024 * 1024 + 1); // > 1MB

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', 'Bearer test-token')
        .send({
          receiver: 'user456',
          encryptedContent: largeContent,
          nonce: 'base64-nonce',
        })
        .expect(400);

      expect(response.body.error).toMatch(/size|limit/i);
    });

    it('should reject message to self', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', 'Bearer test-token')
        .send({
          receiver: 'user123', // Same as sender
          encryptedContent: 'base64-ciphertext',
          nonce: 'base64-nonce',
        })
        .expect(400);

      expect(response.body.error).toMatch(/self|same/i);
    });

    it('should reject message to non-existent user', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', 'Bearer test-token')
        .send({
          receiver: 'nonexistent-user',
          encryptedContent: 'base64-ciphertext',
          nonce: 'base64-nonce',
        })
        .expect(404);

      expect(response.body.error).toMatch(/user.*not found/i);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({
          receiver: 'user456',
          encryptedContent: 'base64-ciphertext',
          nonce: 'base64-nonce',
        })
        .expect(401);

      expect(response.body.error).toMatch(/unauthorized|token/i);
    });

    it('should set isRead to false initially', async () => {
      const mockMessage = {
        _id: 'msg123',
        sender: 'user123',
        receiver: 'user456',
        isRead: false,
        save: jest.fn().mockResolvedValue(true),
      };

      Message.mockImplementation(() => mockMessage);

      await request(app)
        .post('/api/messages')
        .set('Authorization', 'Bearer test-token')
        .send({
          receiver: 'user456',
          encryptedContent: 'base64-ciphertext',
          nonce: 'base64-nonce',
        });

      expect(mockMessage.isRead).toBe(false);
    });
  });

  describe('GET /api/messages/:userId - Retrieve Conversation', () => {
    it('should fetch paginated conversation history', async () => {
      const mockMessages = [
        {
          _id: 'msg1',
          sender: 'user123',
          receiver: 'user456',
          encryptedContent: 'content1',
          createdAt: new Date('2025-01-01'),
        },
        {
          _id: 'msg2',
          sender: 'user456',
          receiver: 'user123',
          encryptedContent: 'content2',
          createdAt: new Date('2025-01-02'),
        },
      ];

      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockMessages),
          }),
        }),
      });

      Message.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/messages/user456')
        .set('Authorization', 'Bearer test-token')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('messages');
      expect(response.body.messages.length).toBe(2);
      expect(response.body).toHaveProperty('total');
      expect(response.body.total).toBe(2);
    });

    it('should apply pagination correctly', async () => {
      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      Message.countDocuments.mockResolvedValue(100);

      await request(app)
        .get('/api/messages/user456')
        .set('Authorization', 'Bearer test-token')
        .query({ page: 2, limit: 20 })
        .expect(200);

      // Verify skip was called with correct offset (page 2, 20 per page = skip 20)
      expect(Message.find().sort().skip).toHaveBeenCalledWith(20);
    });

    it('should default to page 1, limit 50', async () => {
      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await request(app)
        .get('/api/messages/user456')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(Message.find().sort().skip).toHaveBeenCalledWith(0);
      expect(Message.find().sort().skip().limit).toHaveBeenCalledWith(50);
    });

    it('should include both sent and received messages', async () => {
      const mockMessages = [
        { _id: 'msg1', sender: 'user123', receiver: 'user456' }, // User sent
        { _id: 'msg2', sender: 'user456', receiver: 'user123' }, // User received
      ];

      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockMessages),
          }),
        }),
      });

      await request(app)
        .get('/api/messages/user456')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      // Verify query includes both directions
      expect(Message.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.any(Array),
        })
      );
    });

    it('should auto-mark messages as read', async () => {
      Message.updateMany = jest.fn().mockResolvedValue({});

      await request(app)
        .get('/api/messages/user456')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      // Verify updateMany was called to mark received messages as read
      expect(Message.updateMany).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/messages/:messageId - Soft Delete', () => {
    it('should soft-delete message', async () => {
      const mockMessage = {
        _id: 'msg123',
        sender: 'user123',
        deleted: false,
        save: jest.fn().mockResolvedValue(true),
      };

      Message.findById.mockResolvedValue(mockMessage);

      const response = await request(app)
        .delete('/api/messages/msg123')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(mockMessage.deleted).toBe(true);
      expect(mockMessage.save).toHaveBeenCalled();
    });

    it('should prevent deleting others\' messages', async () => {
      const mockMessage = {
        _id: 'msg123',
        sender: 'user456', // Different sender
        deleted: false,
      };

      Message.findById.mockResolvedValue(mockMessage);

      const response = await request(app)
        .delete('/api/messages/msg123')
        .set('Authorization', 'Bearer test-token')
        .expect(403);

      expect(response.body.error).toMatch(/unauthorized|permission/i);
    });

    it('should return 404 for non-existent message', async () => {
      Message.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/messages/nonexistent')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.body.error).toMatch(/not found/i);
    });

    it('should not actually remove message from database', async () => {
      const mockMessage = {
        _id: 'msg123',
        sender: 'user123',
        deleted: false,
        save: jest.fn().mockResolvedValue(true),
      };

      Message.findById.mockResolvedValue(mockMessage);

      await request(app)
        .delete('/api/messages/msg123')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      // Should call save, not deleteOne
      expect(mockMessage.save).toHaveBeenCalled();
      expect(Message.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/messages/unread/count - Unread Count', () => {
    it('should return unread message count', async () => {
      Message.countDocuments.mockResolvedValue(5);

      const response = await request(app)
        .get('/api/messages/unread/count')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('unreadCount');
      expect(response.body.unreadCount).toBe(5);
    });

    it('should return 0 unread if none', async () => {
      Message.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/messages/unread/count')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.unreadCount).toBe(0);
    });
  });

  describe('GET /api/messages/conversations/list - Recent Conversations', () => {
    it('should return list of recent conversations', async () => {
      const mockConversations = [
        {
          _id: 'user456',
          lastMessage: 'Hello!',
          lastMessageTime: new Date(),
          unreadCount: 2,
        },
        {
          _id: 'user789',
          lastMessage: 'How are you?',
          lastMessageTime: new Date(),
          unreadCount: 0,
        },
      ];

      Message.aggregate.mockResolvedValue(mockConversations);

      const response = await request(app)
        .get('/api/messages/conversations/list')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('conversations');
      expect(response.body.conversations.length).toBe(2);
    });

    it('should sort conversations by recency', async () => {
      const mockConversations = [
        {
          _id: 'user456',
          lastMessageTime: new Date('2025-01-05'),
        },
        {
          _id: 'user789',
          lastMessageTime: new Date('2025-01-01'),
        },
      ];

      Message.aggregate.mockResolvedValue(mockConversations);

      const response = await request(app)
        .get('/api/messages/conversations/list')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.conversations[0].lastMessageTime > 
             response.body.conversations[1].lastMessageTime).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for database errors', async () => {
      Message.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/messages/user456')
        .set('Authorization', 'Bearer test-token')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate message format', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', 'Bearer test-token')
        .send({
          receiver: 'user456',
          // Missing encryptedContent and nonce
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Performance & Limits', () => {
    it('should handle large page numbers', async () => {
      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await request(app)
        .get('/api/messages/user456')
        .set('Authorization', 'Bearer test-token')
        .query({ page: 1000000, limit: 50 })
        .expect(200);

      // Should skip 49999950 documents
      expect(Message.find().sort().skip).toHaveBeenCalledWith(49999950);
    });

    it('should enforce max limit per page', async () => {
      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await request(app)
        .get('/api/messages/user456')
        .set('Authorization', 'Bearer test-token')
        .query({ page: 1, limit: 10000 }) // Request too many
        .expect(200);

      // Should be capped at reasonable limit (e.g., 100)
      const callArgs = Message.find().sort().skip().limit.mock.calls[0][0];
      expect(callArgs).toBeLessThanOrEqual(100);
    });
  });
});

module.exports = {};
