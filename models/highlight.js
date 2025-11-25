const mongoose = require("mongoose");

const highlightSchema = new mongoose.Schema({
  streamId: { type: mongoose.Schema.Types.ObjectId, ref: "Stream" },
  streamerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  clipUrl: { type: String, required: true },
  thumbnail: { type: String, default: null },
  duration: { type: Number, default: 0 }, // duration in seconds
  generatedBy: { type: String, enum: ["ai", "manual"], default: "ai" },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Highlight", highlightSchema);