const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const JWT_SECRET = process.env.JWT_SECRET;

const chatSocket = (io) => {
  // =========================================================
  // SOCKET AUTHENTICATION
  // =========================================================

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      console.log("Socket JWT payload:", decoded);

      const userId = decoded.id || decoded.userId || decoded._id;

      if (!userId) {
        console.error("Socket JWT does not contain a user ID:", decoded);

        return next(new Error("Invalid authentication token"));
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error("Invalid user ID in socket token:", userId);

        return next(new Error("Invalid user ID"));
      }

      const user = await User.findById(userId).select(
        "_id name email profileImage about isOnline lastSeen",
      );

      if (!user) {
        console.error("Socket user not found:", userId);

        return next(new Error("User not found"));
      }

      socket.user = user;

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);

      next(new Error("Invalid or expired token"));
    }
  });

  // =========================================================
  // CONNECTION
  // =========================================================

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();

    const userRoom = `user:${userId}`;

    console.log(`Socket connected: ${socket.id} | User: ${userId}`);

    socket.join(userRoom);

    // =====================================================
    // ONLINE PRESENCE
    // =====================================================

    const existingSockets = await io.in(userRoom).fetchSockets();

    const wasAlreadyOnline = existingSockets.length > 1;

    if (!wasAlreadyOnline) {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
      });

      socket.broadcast.emit("user_online", {
        userId,
      });
    }

    // =====================================================
    // JOIN CONVERSATION
    // =====================================================

    socket.on("join_conversation", async (conversationId) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          return;
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (!conversation) {
          socket.emit("socket_error", {
            message: "Conversation not found",
          });

          return;
        }

        const room = `conversation:${conversationId}`;

        socket.join(room);

        console.log(`User ${userId} joined ${room}`);
      } catch (error) {
        console.error("Join conversation error:", error);
      }
    });

    // =====================================================
    // LEAVE CONVERSATION
    // =====================================================

    socket.on("leave_conversation", (conversationId) => {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return;
      }

      const room = `conversation:${conversationId}`;

      socket.leave(room);

      console.log(`User ${userId} left ${room}`);
    });

    // =====================================================
    // SEND MESSAGE
    // =====================================================

    socket.on(
      "send_message",
      async ({
        conversationId,
        content = "",
        messageType = "text",
        attachment = null,
      }) => {
        try {
          const trimmedContent =
            typeof content === "string" ? content.trim() : "";

          const hasAttachment =
            attachment &&
            attachment.url &&
            attachment.originalName &&
            attachment.mimeType;

          if (!conversationId || (!trimmedContent && !hasAttachment)) {
            socket.emit("socket_error", {
              message: "Message content or attachment is required",
            });

            return;
          }

          if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            socket.emit("socket_error", {
              message: "Invalid conversation ID",
            });

            return;
          }

          if (!["text", "image", "file"].includes(messageType)) {
            socket.emit("socket_error", {
              message: "Invalid message type",
            });

            return;
          }

          const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
          });

          if (!conversation) {
            socket.emit("socket_error", {
              message: "Conversation not found",
            });

            return;
          }

          const message = await Message.create({
            conversation: conversationId,

            sender: userId,

            content: trimmedContent,

            messageType,

            attachment: hasAttachment ? attachment : null,

            isRead: false,
          });

          await message.populate("sender", "name email profileImage");

          const room = `conversation:${conversationId}`;

          // Send message to users who
          // currently have conversation open.
          io.to(room).emit("receive_message", message);

          // Update sidebar for all
          // conversation participants.
          conversation.participants.forEach((participantId) => {
            io.to(`user:${participantId.toString()}`).emit(
              "conversation_updated",
              {
                conversationId: conversationId.toString(),

                message,
              },
            );
          });

          await Conversation.findByIdAndUpdate(conversationId, {
            updatedAt: message.createdAt,
          });

          console.log(`Message sent in conversation ${conversationId}`);
        } catch (error) {
          console.error("Send message error:", error);

          socket.emit("socket_error", {
            message: "Failed to send message",
          });
        }
      },
    );

    // =====================================================
    // TYPING
    // =====================================================

    socket.on("typing", async (conversationId) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          return;
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (!conversation) {
          return;
        }

        socket.to(`conversation:${conversationId}`).emit("typing", {
          conversationId,
          userId,
          userName: socket.user.name,
        });
      } catch (error) {
        console.error("Typing error:", error);
      }
    });

    // =====================================================
    // STOP TYPING
    // =====================================================

    socket.on("stop_typing", async (conversationId) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          return;
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (!conversation) {
          return;
        }

        socket.to(`conversation:${conversationId}`).emit("stop_typing", {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error("Stop typing error:", error);
      }
    });

    // =====================================================
    // MESSAGE READ
    // =====================================================

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

          participants: userId,
        });

        if (!conversation) {
          return;
        }

        if (message.sender.toString() === userId) {
          return;
        }

        message.isRead = true;

        await message.save();

        const readData = {
          messageId: message._id.toString(),

          userId,

          conversationId: message.conversation.toString(),
        };

        io.to(`conversation:${message.conversation}`).emit(
          "message_read",
          readData,
        );

        io.to(`user:${message.sender.toString()}`).emit(
          "message_read",
          readData,
        );
      } catch (error) {
        console.error("Message read error:", error);
      }
    });

    // =====================================================
    // DISCONNECT
    // =====================================================

    socket.on("disconnect", async () => {
      try {
        console.log(`Socket disconnected: ${socket.id} | User: ${userId}`);

        const remainingSockets = await io.in(userRoom).fetchSockets();

        if (remainingSockets.length > 0) {
          return;
        }

        const lastSeen = new Date();

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen,
        });

        socket.broadcast.emit("user_offline", {
          userId,
          lastSeen,
        });
      } catch (error) {
        console.error("Disconnect error:", error);
      }
    });
  });
};

module.exports = chatSocket;
