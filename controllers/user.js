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
        const user = await User.findById(decoded.userId).select(
            'username email followers following isStreamer streamTitle streamCategory location createdAt isVerified'
        );
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({
            userId: user._id,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            isStreamer: user.isStreamer,
            streamTitle: user.streamTitle,
            streamCategory: user.streamCategory,
            location: user.location,
            isVerified: user.isVerified,
            createdAt: user.createdAt
        });
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

// Get user profile by ID
const getProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId).select(
            'username email bio avatar followers following isStreamer streamTitle streamCategory location favoriteGames socials badges featuredVideoUrl createdAt isVerified'
        );
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get current user profile
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select(
            'username email bio avatar followers following isStreamer streamTitle streamCategory location favoriteGames socials badges featuredVideoUrl createdAt isVerified'
        );
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update profile information
const updateProfileInfo = async (req, res) => {
    const { username, bio, streamTitle, streamCategory, location, favoriteGames } = req.body;
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.streamTitle = streamTitle || user.streamTitle;
        user.streamCategory = streamCategory || user.streamCategory;
        user.location = location || user.location;
        user.favoriteGames = favoriteGames || user.favoriteGames;

        await user.save();
        res.json({ msg: 'Profile updated successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get streamer profile
const getStreamerProfile = async (req, res) => {
    const { streamerId } = req.params;
    try {
        const streamer = await User.findById(streamerId).select(
            'username avatar bio followers following isStreamer streamTitle streamCategory joinedDate'
        );
        if (!streamer || !streamer.isStreamer) {
            return res.status(404).json({ msg: 'Streamer not found' });
        }
        res.json({
            streamerId: streamer._id,
            username: streamer.username,
            avatar: streamer.avatar,
            bio: streamer.bio,
            followers: streamer.followers,
            following: streamer.following,
            isStreamer: streamer.isStreamer,
            streamTitle: streamer.streamTitle,
            streamCategory: streamer.streamCategory,
            joinedDate: streamer.createdAt
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get viewer profile
const getViewerProfile = async (req, res) => {
    const { viewerId } = req.params;
    try {
        const viewer = await User.findById(viewerId).select(
            'username avatar bio followers following joinedDate'
        );
        if (!viewer) {
            return res.status(404).json({ msg: 'Viewer not found' });
        }
        res.json({
            userId: viewer._id,
            username: viewer.username,
            avatar: viewer.avatar,
            bio: viewer.bio,
            followers: viewer.followers,
            following: viewer.following,
            joinedDate: viewer.createdAt
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Follow/unfollow user
const followUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const currentUser = await User.findById(req.user.userId);
        const targetUser = await User.findById(userId);

        if (!targetUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isFollowing = currentUser.following.includes(userId);

        if (isFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.user.userId);
            await currentUser.save();
            await targetUser.save();
            res.json({ msg: 'User unfollowed successfully', followers: targetUser.followers.length });
        } else {
            // Follow
            currentUser.following.push(userId);
            targetUser.followers.push(req.user.userId);
            await currentUser.save();
            await targetUser.save();
            res.json({ msg: 'User followed successfully', followers: targetUser.followers.length });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get top streamers
const getTopStreamers = async (req, res) => {
    try {
        const topStreamers = await User.find({ isStreamer: true })
            .select('username avatar bio followers streamTitle streamCategory')
            .sort({ followers: -1 })
            .limit(10);

        res.json(topStreamers);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Upsert profile modal
const upsertProfileModal = async (req, res) => {
    const { displayName, avatar, bio, socials, badges, featuredVideoUrl } = req.body;
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.username = displayName || user.username;
        user.avatar = avatar || user.avatar;
        user.bio = bio || user.bio;
        user.socials = socials || user.socials;
        user.badges = badges || user.badges;
        user.featuredVideoUrl = featuredVideoUrl || user.featuredVideoUrl;

        await user.save();
        res.json({ msg: 'Profile modal updated successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get profile modal
const getProfileModal = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId).select(
            'username avatar bio socials badges featuredVideoUrl'
        );
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({
            userId: user._id,
            displayName: user.username,
            avatar: user.avatar,
            bio: user.bio,
            socials: user.socials,
            badges: user.badges,
            featuredVideoUrl: user.featuredVideoUrl
        });
    } catch (err) {
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
    resetPassword,
    getProfile,
    getMyProfile,
    updateProfileInfo,
    getStreamerProfile,
    getViewerProfile,
    followUser,
    getTopStreamers,
    upsertProfileModal,
    getProfileModal
};
