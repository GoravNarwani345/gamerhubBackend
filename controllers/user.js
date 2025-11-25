require('dotenv').config();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail } = require('../config/nodemailer');

// Register a new user
const register=async (req, res) => {
    const {username, email, password } = req.body;
    try {
        let user = await User.find({ $or: [{ email }, { username }] });
        if (user.length) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        const useerCreate=await User.create({
            username,
            email,
            password
        });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set OTP and expiry (10 minutes)
        useerCreate.otp = otp;
        useerCreate.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await useerCreate.save();

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp);
        
        if (!emailSent) {
            return res.status(500).json({ msg: 'Failed to send OTP email' });
        }

        const token = jwt.sign({ userId: useerCreate._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ 
            msg: 'User registered successfully. OTP sent to email',
            token,
            email 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
   
};

// Login user
const login=async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.find
            ({ $or: [{ email }, { username: email }] });
        if (!user.length) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const payload = { userId: user[0]._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get user profile
const userInfo=async (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');       
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('username email createdAt');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }   
};
//get all users
const allUser=async (req, res) => {
    try {
        const users = await User.find().select('username email createdAt');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }   
};
// update user profile
const updateProfile=async (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    const { username, email } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.username = username || user.username;
        user.email = email || user.email;
        await user.save();
        res.json({ msg: 'userInfo updated' });
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }   
};
//update user avtar
const updateAvatar=async (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    const {avtar}=req.files;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.avtar = avtar[0].path || user.avtar;
        await user.save();
        res.json({ msg: 'Avatar updated' });
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set OTP and expiry (10 minutes)
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp);
        
        if (!emailSent) {
            return res.status(500).json({ msg: 'Failed to send OTP email' });
        }

        res.json({ msg: 'OTP sent to email successfully', email });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        // Find user by email
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if OTP exists and is valid
        if (!user.otp || user.otp !== otp) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        // Check if OTP is expired
        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ msg: 'OTP has expired' });
        }

        // OTP is valid, generate reset token
        const resetToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ 
            msg: 'OTP verified successfully',
            resetToken,
            userId: user._id 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    const { resetToken, newPassword } = req.body;
    try {
        // Verify reset token
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        
        // Find user
        let user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update password
        user.password = newPassword;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        res.json({ msg: 'Password reset successfully' });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ msg: 'Reset token has expired' });
        }
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    userInfo,
    updateProfile,
    updateAvatar,
    allUser,
    forgotPassword,
    verifyOTP,
    resetPassword
};