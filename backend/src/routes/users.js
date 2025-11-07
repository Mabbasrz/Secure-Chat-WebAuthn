import express from 'express';
import User from '../models/User.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/users/profile
 * Get current user's profile
 * 
 * @returns { _id, username, email, publicKeyForEncryption, status, lastLogin }
 */
router.get('/profile', verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      'username email publicKeyForEncryption status lastLogin'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * GET /api/users/search
 * Search for users by username or email
 * 
 * @query q: search string (min 2 chars)
 * @returns [ { _id, username, email, publicKeyForEncryption, status } ]
 */
router.get('/search', verifyJWT, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Search with regex (case-insensitive)
    const searchRegex = new RegExp(q, 'i');

    const users = await User.find(
      {
        $or: [
          { username: searchRegex },
          { email: searchRegex }
        ],
        _id: { $ne: req.user.userId } // Exclude current user
      }
    )
      .select('username email publicKeyForEncryption status')
      .limit(20)
      .lean();

    res.json({ users });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

/**
 * GET /api/users/:userId/public-key
 * Get a user's public encryption key (for sending encrypted messages)
 * 
 * @params userId: ObjectId
 * @returns { userId, username, publicKeyForEncryption }
 */
router.get('/:userId/public-key', verifyJWT, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('username publicKeyForEncryption');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user._id,
      username: user.username,
      publicKeyForEncryption: user.publicKeyForEncryption
    });

  } catch (error) {
    console.error('Get public key error:', error);
    res.status(500).json({ error: 'Failed to fetch public key' });
  }
});

/**
 * GET /api/users/online
 * Get list of online users
 * 
 * @returns [ { _id, username, status, lastLogin } ]
 */
router.get('/online', verifyJWT, async (req, res) => {
  try {
    const onlineUsers = await User.find({ status: 'online' })
      .select('username status lastLogin')
      .lean();

    res.json({ users: onlineUsers });

  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

/**
 * PUT /api/users/profile
 * Update current user's profile (username, email)
 * 
 * @body { username?: string, email?: string }
 * @returns { _id, username, email, publicKeyForEncryption }
 */
router.put('/profile', verifyJWT, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update allowed fields
    if (username && username !== user.username) {
      // Check if new username is available
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      // Check if new email is available
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      publicKeyForEncryption: user.publicKeyForEncryption
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * DELETE /api/users/account
 * Permanently delete user account (hard delete)
 * WARNING: This action cannot be undone
 * 
 * @body { password?: string } - future: require password confirmation
 * @returns { message }
 */
router.delete('/account', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Delete user and all their messages
    await User.findByIdAndDelete(userId);

    // Future: Also soft-delete messages or archive them
    // For now, keeping messages allows data recovery

    res.json({ message: 'Account deleted' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
