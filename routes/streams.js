const express = require('express');
const router = express.Router();
const {
    getLiveStreams,
    getStreamById,
    createStream,
    getUserStreams,
    updateStream,
    getStreamAnalytics,
    getStreamsByCategory,
    searchStreams
} = require('../controllers/streams');
const auth = require('../middleware/auth');

// Get all live streams
router.get('/live', getLiveStreams);

// Get stream by ID
router.get('/:streamId', getStreamById);

// Create a new stream (protected)
router.post('/create', auth, createStream);

// Get user's streams (protected)
router.get('/user/streams', auth, getUserStreams);

// Update stream info (protected)
router.put('/:streamId', auth, updateStream);

// Get stream analytics (protected)
router.get('/:streamId/analytics', auth, getStreamAnalytics);

// Get streams by category
router.get('/category/:category', getStreamsByCategory);

// Search streams
router.get('/search', searchStreams);

module.exports = router;
