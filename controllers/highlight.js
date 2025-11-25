const Highlight = require('../models/highlight');

// Create a new highlight (protected endpoint or socket)
const createHighlight = async (req, res) => {
  try {
    const { streamId, streamerId, clipUrl, thumbnail, duration, tags, generatedBy } = req.body;
    if (!clipUrl || !streamId || !streamerId) {
      return res.status(400).json({ msg: 'streamId, streamerId and clipUrl are required' });
    }

    const highlight = new Highlight({
      streamId,
      streamerId,
      clipUrl,
      thumbnail,
      duration,
      tags,
      generatedBy: generatedBy || 'ai'
    });

    await highlight.save();
    res.status(201).json({ msg: 'Highlight saved', highlight });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get highlights by stream
const getHighlightsByStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const highlights = await Highlight.find({ streamId }).sort({ createdAt: -1 });
    res.json(highlights);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get highlights by streamer
const getHighlightsByStreamer = async (req, res) => {
  try {
    const { streamerId } = req.params;
    const highlights = await Highlight.find({ streamerId }).sort({ createdAt: -1 });
    res.json(highlights);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  createHighlight,
  getHighlightsByStream,
  getHighlightsByStreamer
};
