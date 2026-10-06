const express = require("express");

const {
  getConversations,
  createConversation,
  createGroupConversation,
  getConversationById,
  getGroupMembers,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  updateGroup,
  makeAdmin,
  removeAdmin,
} = require("../controllers/conversationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =========================================================
// AUTHENTICATION
// =========================================================

router.use(authMiddleware);

// =========================================================
// CONVERSATIONS
// =========================================================

router.get("/", getConversations);

router.post("/", createConversation);

router.post("/group", createGroupConversation);

// =========================================================
// GROUP MANAGEMENT
// =========================================================

router.get("/:id/members", getGroupMembers);

router.post("/:id/members", addGroupMembers);

router.delete("/:id/members/:userId", removeGroupMember);

router.post("/:id/leave", leaveGroup);

router.patch("/:id", updateGroup);

router.post("/:id/admins/:userId", makeAdmin);

router.delete("/:id/admins/:userId", removeAdmin);

// =========================================================
// SINGLE CONVERSATION
// =========================================================

router.get("/:id", getConversationById);

module.exports = router;
