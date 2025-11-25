require('dotenv').config();
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Get user profile
const getProfile = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId).select('-password -otp -otpExpiry -accesToken -refreshToken');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get current user profile (with auth)
const getMyProfile = async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    try {
        if (!token) {
            return res.status(401).json({ msg: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password -otp -otpExpiry -accesToken -refreshToken');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Update profile information
const updateProfileInfo = async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const { username, bio, avatar, streamTitle, streamCategory } = req.body;

    try {
        if (!token) {
            return res.status(401).json({ msg: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if username is unique (if changed)
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ msg: 'Username already taken' });
            }
            user.username = username;
        }

        if (bio !== undefined) user.bio = bio;
        if (avatar) user.avatar = avatar;
        if (streamTitle) user.streamTitle = streamTitle;
        if (streamCategory) user.streamCategory = streamCategory;

        await user.save();

        res.json({
            msg: 'Profile updated successfully',
            user: user.toObject()
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get streamer profile (for modal/popup)
const getStreamerProfile = async (req, res) => {
    const { streamerId } = req.params;

    try {
        const user = await User.findById(streamerId).select(
            'username avatar bio followers following isStreamer streamTitle streamCategory createdAt'
        );

        if (!user) {
            return res.status(404).json({ msg: 'Streamer not found' });
        }

        res.json({
            streamerId: user._id,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            isStreamer: user.isStreamer,
            streamTitle: user.streamTitle,
            streamCategory: user.streamCategory,
            joinedDate: user.createdAt
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
        const user = await User.findById(viewerId).select(
            'username avatar bio followers following createdAt'
        );

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({
            userId: user._id,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            joinedDate: user.createdAt
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Follow/Unfollow user
const followUser = async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const { userId } = req.params;

    try {
        if (!token) {
            return res.status(401).json({ msg: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.userId === userId) {
            return res.status(400).json({ msg: 'Cannot follow yourself' });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const currentUser = await User.findById(decoded.userId);
        
        // For demo, just increment followers
        targetUser.followers += 1;
        currentUser.following += 1;

        await Promise.all([targetUser.save(), currentUser.save()]);

        res.json({
            msg: 'User followed successfully',
            followers: targetUser.followers
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get top streamers
const getTopStreamers = async (req, res) => {
    try {
        const streamers = await User.find({ isStreamer: true })
            .select('username avatar bio followers streamTitle streamCategory')
            .sort({ followers: -1 })
            .limit(10);

        res.json(streamers);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = {
    getProfile,
    getMyProfile,
    updateProfileInfo,
    getStreamerProfile,
    getViewerProfile,
    followUser,
    getTopStreamers
};
