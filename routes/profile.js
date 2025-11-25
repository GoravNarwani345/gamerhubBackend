const express = require('express');
const router = express.Router();
const {
    getProfile,
    getMyProfile,
    updateProfileInfo,
    getStreamerProfile,
    getViewerProfile,
    followUser,
    getTopStreamers
} = require('../controllers/profile');
const auth = require('../middleware/auth');

// Get any user profile by ID
router.get('/:userId', getProfile);

// Get current user's profile (protected)
router.get('/me/profile', auth, getMyProfile);

// Update profile information (protected)
router.put('/me/update', auth, updateProfileInfo);

// Get streamer profile info (for modal)
router.get('/streamer/:streamerId', getStreamerProfile);

// Get viewer profile info (for modal)
router.get('/viewer/:viewerId', getViewerProfile);

// Follow a user (protected)
router.post('/:userId/follow', auth, followUser);

// Get top streamers
router.get('/trending/top-streamers', getTopStreamers);

module.exports = router;
