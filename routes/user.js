const express = require('express');
const router = express.Router();
const {
    register,
    login,
    userInfo,
    forgotPassword,
    verifyOTP,
    resetPassword,
    getProfile,
    getMyProfile,
    updateProfileInfo,
    getStreamerProfile,
    getViewerProfile,
    followUser,
    getTopStreamers,
    upsertProfileModal,
    getProfileModal,
    updateAvatar
} = require('../controllers/user');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../uploads/');
    }
    ,
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});
const upload = multer({ storage: storage });

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// User profile route
router.get('/userdata', auth, userInfo);

// Forgot Password - Send OTP
router.post('/forgot-password', forgotPassword);

// Verify OTP
router.post('/verify-otp', verifyOTP);

// Reset Password
router.post('/reset-password', resetPassword);

// Profile routes
router.get('/:userId', getProfile);
router.get('/me/profile', auth, getMyProfile);
router.put('/me/update', auth, updateProfileInfo);
router.get('/streamer/:streamerId', getStreamerProfile);
router.get('/viewer/:viewerId', getViewerProfile);
router.post('/:userId/follow', auth, followUser);
router.get('/trending/top-streamers', getTopStreamers);

// Profile modal routes
router.post('/profile-modals/me', auth, upsertProfileModal);
router.get('/profile-modals/:userId', getProfileModal);

// Update avatar route
router.put('/me/avatar', auth, upload.single('avatar'), updateAvatar);

module.exports = router;
