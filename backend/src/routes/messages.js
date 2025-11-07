import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/messages/:userId
 * Get message history with a specific user (paginated)
 * 
 * @params userId: ObjectId of the conversation partner
 * @query limit=50, skip=0
 * @returns [ { _id, sender, receiver, encryptedContent, nonce, isRead, createdAt } ]
 */
router.get('/:userId', verifyJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    const currentUserId = req.user.userId;

    // Validate
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Check if other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Query messages between current user and other user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ],
      deleted: false
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(Math.min(parseInt(limit), 100)) // Max 100 per request
      .lean(); // Optimization: return plain objects

    // Mark as read if current user is receiver
    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false
      },
      { isRead: true },
      { multi: true }
    );

    res.json({
      messages: messages.reverse(), // Oldest first
      count: messages.length,
      pageSize: Math.min(parseInt(limit), 100),
      offset: parseInt(skip)
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/messages
 * Send an encrypted message to a user
 * 
 * @body { 
 *   receiver: ObjectId,
 *   encryptedContent: base64(NaCl encrypted),
 *   nonce: base64(24-byte nonce)
 * }
 * @returns { _id, sender, receiver, encryptedContent, nonce, createdAt }
 */
router.post('/', verifyJWT, async (req, res) => {
  try {
    const { receiver, encryptedContent, nonce } = req.body;
    const sender = req.user.userId;

    // Validate
    if (!receiver || !encryptedContent || !nonce) {
      return res.status(400).json({ error: 'Receiver, encryptedContent, and nonce required' });
    }

    // Validate receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Prevent sending to self
    if (sender === receiver) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    // Validate encrypted content format (should be base64)
    if (typeof encryptedContent !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(encryptedContent)) {
      return res.status(400).json({ error: 'Invalid encryptedContent format' });
    }

    // Validate nonce format
    if (typeof nonce !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(nonce)) {
      return res.status(400).json({ error: 'Invalid nonce format' });
    }

    // Check message size (base64 represents roughly 3/4 of original size)
    // Limit to 1MB ciphertext
    if (encryptedContent.length > 1024 * 1024) {
      return res.status(400).json({ error: 'Message too large (max 1MB)' });
    }

    // Create message
    const message = new Message({
      sender,
      receiver,
      encryptedContent,
      nonce,
      isRead: false
    });

    await message.save();

    // Return to sender (no need to decrypt)
    res.status(201).json({
      _id: message._id,
      sender: message.sender,
      receiver: message.receiver,
      encryptedContent: message.encryptedContent,
      nonce: message.nonce,
      createdAt: message.createdAt
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * DELETE /api/messages/:messageId
 * Soft-delete a message (set deleted flag, don't actually remove from DB)
 * 
 * @params messageId: ObjectId
 * @returns { message: "Message deleted" }
 */
router.delete('/:messageId', verifyJWT, async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.userId;

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check authorization (only sender can delete)
    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    // Soft delete
    message.deleted = true;
    await message.save();

    res.json({ message: 'Message deleted' });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

/**
 * GET /api/messages/unread/count
 * Get count of unread messages for current user
 * 
 * @returns { unreadCount }
 */
router.get('/unread/count', verifyJWT, async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const unreadCount = await Message.countDocuments({
      receiver: currentUserId,
      isRead: false,
      deleted: false
    });

    res.json({ unreadCount });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

/**
 * GET /api/messages/conversations/list
 * Get list of recent conversations (for sidebar)
 * 
 * @query limit=20
 * @returns [ { userId, username, lastMessage, lastMessageTime, unreadCount } ]
 */
router.get('/conversations/list', verifyJWT, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { limit = 20 } = req.query;

    // Get all unique conversation partners from messages
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ],
          deleted: false
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', currentUserId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $max: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', currentUserId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { lastMessage: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          userId: '$_id',
          username: { $arrayElemAt: ['$userInfo.username', 0] },
          lastMessageTime: '$lastMessage',
          unreadCount: '$unreadCount',
          _id: 0
        }
      }
    ]);

    res.json({ conversations });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

export default router;
