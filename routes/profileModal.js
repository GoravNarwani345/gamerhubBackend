const express = require('express');
const router = express.Router();
const { upsertProfileModal, getProfileModal } = require('../controllers/profileModal');
const auth = require('../middleware/auth');

// Create or update profile modal for current user
router.post('/me', auth, upsertProfileModal);

// Get profile modal by user id
router.get('/:userId', getProfileModal);

module.exports = router;
