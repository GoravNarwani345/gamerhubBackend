require('dotenv').config();
const Stream = require('../models/streams');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Get all live streams
const getLiveStreams = async (req, res) => {
    try {
        const liveStreams = await Stream.find({ status: 'live', isActive: true })
            .populate('userId', 'username avatar bio followers')
            .sort({ startedAt: -1 });

        res.json(liveStreams);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get stream by ID
const getStreamById = async (req, res) => {
    const { streamId } = req.params;
    try {
        const stream = await Stream.findById(streamId)
            .populate('userId', 'username avatar bio followers isStreamer')
            .populate('viewers', 'username avatar');

        if (!stream) {
            return res.status(404).json({ msg: 'Stream not found' });
        }

        res.json(stream);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Create a new stream (for streamer)
const createStream = async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const { title, description, category, thumbnail } = req.body;

    try {
        if (!token) {
            return res.status(401).json({ msg: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Handle path for thumbnail
        let thumbnailPath = null;
        if (req.file) {
            thumbnailPath = `/uploads/${req.file.filename}`;
        }

        const stream = new Stream({
            userId: user._id,
            title: title || `${user.username}'s Stream`,
            description: description || '',
            category: category || 'Gaming',
            thumbnail: thumbnailPath || thumbnail || null,
            status: 'offline'
        });

        await stream.save();

        // Update user as streamer
        user.isStreamer = true;
        user.streamTitle = title || `${user.username}'s Stream`;
        user.streamCategory = category || 'Gaming';
        await user.save();

        res.status(201).json({
            msg: 'Stream created successfully',
            stream: await stream.populate('userId', 'username avatar')
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get user's streams
const getUserStreams = async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    try {
        if (!token) {
            return res.status(401).json({ msg: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const streams = await Stream.find({ userId: decoded.userId })
            .sort({ createdAt: -1 });

        res.json(streams);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update stream info
const updateStream = async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const { streamId } = req.params;
    const { title, description, category, thumbnail } = req.body;

    try {
        if (!token) {
            return res.status(401).json({ msg: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const stream = await Stream.findById(streamId);

        if (!stream) {
            return res.status(404).json({ msg: 'Stream not found' });
        }

        if (stream.userId.toString() !== decoded.userId) {
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        stream.title = title || stream.title;
        stream.description = description || stream.description;
        stream.category = category || stream.category;
        stream.thumbnail = thumbnail || stream.thumbnail;
        await stream.save();

        res.json({ msg: 'Stream updated successfully', stream });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get stream analytics
const getStreamAnalytics = async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const { streamId } = req.params;

    try {
        if (!token) {
            return res.status(401).json({ msg: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const stream = await Stream.findById(streamId);

        if (!stream) {
            return res.status(404).json({ msg: 'Stream not found' });
        }

        if (stream.userId.toString() !== decoded.userId) {
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        res.json({
            streamId: stream._id,
            title: stream.title,
            peakViewers: stream.viewersCount,
            totalViewers: stream.viewers.length,
            totalComments: stream.totalComments,
            totalLikes: stream.totalLikes,
            duration: stream.endedAt ? stream.endedAt - stream.startedAt : Date.now() - stream.startedAt
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get streams by category
const getStreamsByCategory = async (req, res) => {
    const { category } = req.params;

    try {
        const streams = await Stream.find({
            category: new RegExp(category, 'i'),
            status: 'live',
            isActive: true
        })
            .populate('userId', 'username avatar bio followers')
            .sort({ viewersCount: -1 });

        res.json(streams);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Search streams
const searchStreams = async (req, res) => {
    const { query } = req.query;

    try {
        const streams = await Stream.find({
            $or: [
                { title: new RegExp(query, 'i') },
                { description: new RegExp(query, 'i') },
                { category: new RegExp(query, 'i') }
            ],
            status: 'live',
            isActive: true
        })
            .populate('userId', 'username avatar bio followers')
            .sort({ viewersCount: -1 });

        res.json(streams);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = {
    getLiveStreams,
    getStreamById,
    createStream,
    getUserStreams,
    updateStream,
    getStreamAnalytics,
    getStreamsByCategory,
    searchStreams
};
