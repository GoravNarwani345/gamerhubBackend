const mongoose = require('mongoose');

const profileModalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  displayName: { type: String, default: '' },
  avatar: { type: String, default: null },
  bio: { type: String, default: '' },
  socials: {
    twitter: { type: String, default: '' },
    twitch: { type: String, default: '' },
    youtube: { type: String, default: '' },
    instagram: { type: String, default: '' }
  },
  badges: { type: [String], default: [] },
  featuredVideoUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

profileModalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ProfileModal', profileModalSchema);
