const ProfileModal = require('../models/profileModal');

// Create or update profile modal (for streamer)
const upsertProfileModal = async (req, res) => {
  try {
    // support auth middleware which sets `req.user.userId`
    const tokenUserId = req.user && req.user.userId;
    const { userId, displayName, avatar, bio, socials, badges, featuredVideoUrl } = req.body;
    const ownerId = userId || tokenUserId;

    if (!ownerId) return res.status(400).json({ msg: 'userId is required' });

    let profile = await ProfileModal.findOne({ userId: ownerId });
    if (!profile) {
      profile = new ProfileModal({
        userId: ownerId,
        displayName,
        avatar,
        bio,
        socials,
        badges,
        featuredVideoUrl
      });
    } else {
      profile.displayName = displayName || profile.displayName;
      profile.avatar = avatar || profile.avatar;
      profile.bio = bio || profile.bio;
      profile.socials = socials || profile.socials;
      profile.badges = badges || profile.badges;
      profile.featuredVideoUrl = featuredVideoUrl || profile.featuredVideoUrl;
    }

    await profile.save();

    res.json({ msg: 'Profile modal saved', profile });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get profile modal by userId
const getProfileModal = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await ProfileModal.findOne({ userId });
    if (!profile) return res.status(404).json({ msg: 'Profile modal not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { upsertProfileModal, getProfileModal };