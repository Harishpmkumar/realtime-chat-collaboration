const mongoose = require("mongoose");

const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// GET /api/conversations/:id/messages
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      conversation: id,
    })
      .populate("sender", "name email profileImage")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: {
        messages,
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

// POST /api/conversations/:id/messages
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, messageType = "text" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!["text", "image", "file"].includes(messageType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message type",
      });
    }

    const message = await Message.create({
      conversation: id,
      sender: req.user._id,
      content: content.trim(),
      messageType,
    });

    await message.populate("sender", "name email profileImage");

    // Update conversation's latest activity
    conversation.updatedAt = new Date();
    await conversation.save();

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// PATCH /api/messages/:id/read
const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation",
      });
    }

    message.isRead = true;
    await message.save();

    return res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: {
        message,
      },
    });
  } catch (error) {
    console.error("Mark message read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markMessageAsRead,
};
