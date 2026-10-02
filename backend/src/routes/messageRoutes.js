const express = require("express");

const {
  getMessages,
  sendMessage,
  markMessageAsRead,
} = require("../controllers/messageController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/conversations/:id/messages", getMessages);

router.post("/conversations/:id/messages", sendMessage);

router.patch("/messages/:id/read", markMessageAsRead);

module.exports = router;
