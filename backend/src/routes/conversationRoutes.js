const express = require("express");

const {
  getConversations,
  createConversation,
  getConversationById,
} = require("../controllers/conversationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getConversations);

router.post("/", createConversation);

router.get("/:id", getConversationById);

module.exports = router;
