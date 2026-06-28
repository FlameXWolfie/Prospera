import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Hashed password. `select: false` keeps it out of normal queries — it is
    // only loaded explicitly during login (.select('+passwordHash')).
    passwordHash: { type: String, default: null, select: false },
    googleId: { type: String, default: null },
    avatar: { type: String, default: '' },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function comparePassword(password) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(password, this.passwordHash);
};

// What we are willing to send to the client — never the hash.
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    provider: this.provider,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
