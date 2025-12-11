const express = require('express');
const router = express.Router();
const {
    getNewProfile,
    getMyNewProfile,
    updateNewProfileInfo,
    createNewProfile,
    deleteNewProfile
} = require('../controllers/newProfile');
const auth = require('../middleware/auth');

// Get any user profile by ID
router.get('/:userId', getNewProfile);

// Get current user's profile (protected)
router.get('/me/profile', auth, getMyNewProfile);

// Update profile information (protected)
router.put('/me/update', auth, updateNewProfileInfo);

// Create new profile
router.post('/create', createNewProfile);

// Delete profile (protected)
router.delete('/me/delete', auth, deleteNewProfile);

module.exports = router;
