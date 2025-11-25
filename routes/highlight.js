const express = require('express');
const router = express.Router();
const { createHighlight, getHighlightsByStream, getHighlightsByStreamer } = require('../controllers/highlight');
const auth = require('../middleware/auth');

// Create highlight (protected)
router.post('/', auth, createHighlight);

// Get highlights for a stream
router.get('/stream/:streamId', getHighlightsByStream);

// Get highlights for a streamer
router.get('/streamer/:streamerId', getHighlightsByStreamer);

module.exports = router;
