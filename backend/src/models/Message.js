const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      trim: true,
    },

    fileName: {
      type: String,
      trim: true,
    },

    mimeType: {
      type: String,
      trim: true,
    },

    size: {
      type: Number,
      min: 0,
    },

    url: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const reactionSchema = new mongoose.Schema(
  {
    emoji: {
      type: String,
      required: true,
      trim: true,
    },

    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    _id: false,
  },
);

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },

    attachment: {
      type: attachmentSchema,
      default: null,
    },

    reactions: {
      type: [reactionSchema],
      default: [],
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.pre("validate", function validateMessage() {
  if (this.isDeleted) {
    return;
  }

  const hasContent =
    typeof this.content === "string" && this.content.trim().length > 0;

  const hasAttachment =
    this.attachment &&
    this.attachment.url &&
    this.attachment.originalName &&
    this.attachment.mimeType;

  if (!hasContent && !hasAttachment) {
    this.invalidate("content", "Message must contain text or an attachment");
  }
});

module.exports = mongoose.model("Message", messageSchema);
