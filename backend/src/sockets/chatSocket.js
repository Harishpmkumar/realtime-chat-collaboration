const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
};

const chatSocket = (io) => {
  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();

    console.log(`Socket connected: ${socket.user.name}`);

    // Personal room
    socket.join(`user:${userId}`);

    // Mark user online
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
    });

    io.emit("user_online", {
      userId,
    });

    // Join conversation
    socket.on("join_conversation", async (conversationId) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          return socket.emit("socket_error", {
            message: "Invalid conversation ID",
          });
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });

        if (!conversation) {
          return socket.emit("socket_error", {
            message: "Conversation not found or access denied",
          });
        }

        socket.join(`conversation:${conversationId}`);

        console.log(
          `${socket.user.name} joined conversation ${conversationId}`,
        );
      } catch (error) {
        socket.emit("socket_error", {
          message: "Failed to join conversation",
        });
      }
    });

    // Leave conversation
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send real-time message
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, content, messageType = "text" } = data;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          return socket.emit("socket_error", {
            message: "Invalid conversation ID",
          });
        }

        if (!content || !content.trim()) {
          return socket.emit("socket_error", {
            message: "Message content is required",
          });
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });

        if (!conversation) {
          return socket.emit("socket_error", {
            message: "Conversation not found or access denied",
          });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          content: content.trim(),
          messageType,
        });

        const populatedMessage = await Message.findById(message._id).populate(
          "sender",
          "name email profileImage",
        );

        await Conversation.findByIdAndUpdate(conversationId, {
          updatedAt: new Date(),
        });

        io.to(`conversation:${conversationId}`).emit(
          "receive_message",
          populatedMessage,
        );
      } catch (error) {
        console.error("Socket send message error:", error);

        socket.emit("socket_error", {
          message: "Failed to send message",
        });
      }
    });

    // Typing
    socket.on("typing", (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit("typing", {
        conversationId,
        userId,
        userName: socket.user.name,
      });
    });

    // Stop typing
    socket.on("stop_typing", (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit("stop_typing", {
        conversationId,
        userId,
      });
    });

    // Mark message as read
    socket.on("message_read", async (messageId) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
          return;
        }

        const message = await Message.findById(messageId);

        if (!message) {
          return;
        }

        const conversation = await Conversation.findOne({
          _id: message.conversation,
          participants: socket.user._id,
        });

        if (!conversation) {
          return;
        }

        message.isRead = true;
        await message.save();

        io.to(`conversation:${message.conversation}`).emit("message_read", {
          messageId: message._id,
          userId,
        });
      } catch (error) {
        console.error("Message read error:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.user.name}`);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      io.emit("user_offline", {
        userId,
        lastSeen: new Date(),
      });
    });
  });
};

module.exports = chatSocket;
