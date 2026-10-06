const express = require("express");

const {
  getMessages,
  sendMessage,
  uploadAttachment,
  markMessageAsRead,
} = require("../controllers/messageController");

const authMiddleware = require("../middleware/authMiddleware");

const { uploadSingleAttachment } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(authMiddleware);

// Get conversation messages.
router.get("/conversations/:id/messages", getMessages);

// Send normal REST message.
router.post("/conversations/:id/messages", sendMessage);

// Upload an attachment before sending it through Socket.IO.
router.post("/messages/upload", uploadSingleAttachment, uploadAttachment);

// Mark message as read.
router.patch("/messages/:id/read", markMessageAsRead);

module.exports = router;
