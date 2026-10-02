const mongoose = require("mongoose");

const Conversation = require("../models/Conversation");
const User = require("../models/User");

// GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate(
        "participants",
        "name email profileImage about isOnline lastSeen",
      )
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: conversations.length,
      data: {
        conversations,
      },
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};

// POST /api/conversations
const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "Participant ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid participant ID",
      });
    }

    if (participantId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot create a conversation with yourself",
      });
    }

    const participant = await User.findById(participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant user not found",
      });
    }

    const existingConversation = await Conversation.findOne({
      type: "private",
      participants: {
        $all: [req.user._id, participantId],
      },
    }).populate(
      "participants",
      "name email profileImage about isOnline lastSeen",
    );

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        data: {
          conversation: existingConversation,
        },
      });
    }

    const conversation = await Conversation.create({
      type: "private",
      participants: [req.user._id, participantId],
      createdBy: req.user._id,
    });

    await conversation.populate(
      "participants",
      "name email profileImage about isOnline lastSeen",
    );

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    });
  }
};

// GET /api/conversations/:id
const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    }).populate(
      "participants",
      "name email profileImage about isOnline lastSeen",
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversation",
    });
  }
};

module.exports = {
  getConversations,
  createConversation,
  getConversationById,
};
