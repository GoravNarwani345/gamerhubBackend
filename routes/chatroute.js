// routes/chatroute.js
const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, updateMessage, deleteMessage } = require("../controllers/chat");

router.post("/send", sendMessage);
router.get("/:streamId", getMessages);
router.put("/:id", updateMessage);
router.delete("/:id", deleteMessage);

module.exports = router;
