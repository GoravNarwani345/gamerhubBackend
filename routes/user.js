const express = require('express');
const router = express.Router();
const { register, login, userInfo, forgotPassword, verifyOTP, resetPassword } = require('../controllers/user');
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
router.get('/user', auth, userInfo);

// Forgot Password - Send OTP
router.post('/forgot-password', forgotPassword);

// Verify OTP
router.post('/verify-otp', verifyOTP);

// Reset Password
router.post('/reset-password', resetPassword);

module.exports = router;
