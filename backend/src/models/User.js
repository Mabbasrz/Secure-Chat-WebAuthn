// backend/src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/.+@.+\..+/, 'Please provide a valid email'],
    },
    webauthnCredentials: [
      {
        id: Buffer,
        publicKey: Buffer,
        signCount: Number,
        transports: [String],
      },
    ],
    publicKeyForEncryption: {
      type: String, // NaCl public key (base64)
    },
    lastLogin: Date,
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('User', userSchema);
