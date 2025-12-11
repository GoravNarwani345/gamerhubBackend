require('dotenv').config();
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Get user profile (new implementation)
const getNewProfile = async (req, res) => {
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

// Get current user profile (with auth) - new implementation
const getMyNewProfile = async (req, res) => {
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

// Update profile information - new implementation
const updateNewProfileInfo = async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const { username, bio, avatar, streamTitle, streamCategory, location, favoriteGames } = req.body;

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
        if (location !== undefined) user.location = location;

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

// Create new profile (if needed)
const createNewProfile = async (req, res) => {
    const { username, email, password, bio, avatar } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            username,
            email,
            password,
            bio,
            avatar
        });

        await user.save();

        res.json({
            msg: 'Profile created successfully',
            user: user.toObject()
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete profile
const deleteNewProfile = async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    try {
        if (!token) {
            return res.status(401).json({ msg: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByIdAndDelete(decoded.userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'Profile deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = {
    getNewProfile,
    getMyNewProfile,
    updateNewProfileInfo,
    createNewProfile,
    deleteNewProfile
};
