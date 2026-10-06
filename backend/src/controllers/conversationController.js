const mongoose = require("mongoose");

const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Message = require("../models/Message");

// =========================================================
// HELPER FUNCTIONS
// =========================================================

const isGroupConversation = (conversation) => {
  return conversation?.type === "group";
};

const isAdmin = (conversation, userId) => {
  return conversation.admins.some(
    (admin) => admin._id?.toString() === userId.toString(),
  );
};

const populateConversation = async (conversation) => {
  await conversation.populate([
    {
      path: "participants",
      select: "name email profileImage about isOnline lastSeen",
    },
    {
      path: "admins",
      select: "name email profileImage",
    },
    {
      path: "createdBy",
      select: "name email profileImage",
    },
  ]);

  return conversation;
};

// =========================================================
// GET /api/conversations
// =========================================================

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate(
        "participants",
        "name email profileImage about isOnline lastSeen",
      )
      .populate("admins", "name email profileImage")
      .sort({ updatedAt: -1 });

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await Message.findOne({
          conversation: conversation._id,
        })
          .sort({
            createdAt: -1,
          })
          .populate("sender", "name email profileImage");

        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: {
            $ne: userId,
          },
          isRead: false,
        });

        return {
          ...conversation.toObject(),
          lastMessage,
          unreadCount,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      count: conversationsWithDetails.length,
      data: {
        conversations: conversationsWithDetails,
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

// =========================================================
// POST /api/conversations
// =========================================================

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

// =========================================================
// POST /api/conversations/group
// =========================================================

const createGroupConversation = async (req, res) => {
  try {
    const { name, description, participantIds, groupImage } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one participant is required",
      });
    }

    const uniqueParticipantIds = [
      ...new Set(participantIds.map((id) => id.toString())),
    ];

    const invalidId = uniqueParticipantIds.find(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );

    if (invalidId) {
      return res.status(400).json({
        success: false,
        message: `Invalid participant ID: ${invalidId}`,
      });
    }

    const participantIdsWithCreator = [
      req.user._id.toString(),
      ...uniqueParticipantIds,
    ];

    const uniqueIds = [...new Set(participantIdsWithCreator)];

    const users = await User.find({
      _id: {
        $in: uniqueIds,
      },
    }).select("name email profileImage about isOnline lastSeen");

    if (users.length !== uniqueIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more participant users were not found",
      });
    }

    const conversation = await Conversation.create({
      type: "group",
      name: name.trim(),
      description: description?.trim() || "",
      groupImage: groupImage || "",
      participants: uniqueIds,
      admins: [req.user._id],
      createdBy: req.user._id,
    });

    await populateConversation(conversation);

    return res.status(201).json({
      success: true,
      message: "Group conversation created successfully",
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error("Create group conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create group conversation",
    });
  }
};

// =========================================================
// GET /api/conversations/:id
// =========================================================

const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    })
      .populate(
        "participants",
        "name email profileImage about isOnline lastSeen",
      )
      .populate("admins", "name email profileImage");

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

// =========================================================
// GET /api/conversations/:id/members
// =========================================================

const getGroupMembers = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

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

    if (!isGroupConversation(conversation)) {
      return res.status(400).json({
        success: false,
        message: "Member management is only available for groups",
      });
    }

    return res.status(200).json({
      success: true,
      count: conversation.participants.length,
      data: {
        members: conversation.participants,
      },
    });
  } catch (error) {
    console.error("Get group members error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch group members",
    });
  }
};

// =========================================================
// POST /api/conversations/:id/members
// =========================================================

const addGroupMembers = async (req, res) => {
  try {
    const { participantIds } = req.body;

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one participant ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!isGroupConversation(conversation)) {
      return res.status(400).json({
        success: false,
        message: "Members can only be added to groups",
      });
    }

    if (!isAdmin(conversation, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only group admins can add members",
      });
    }

    const uniqueParticipantIds = [
      ...new Set(participantIds.map((id) => id.toString())),
    ];

    const invalidId = uniqueParticipantIds.find(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );

    if (invalidId) {
      return res.status(400).json({
        success: false,
        message: `Invalid participant ID: ${invalidId}`,
      });
    }

    const existingMemberIds = conversation.participants.map((id) =>
      id.toString(),
    );

    const newParticipantIds = uniqueParticipantIds.filter(
      (id) => !existingMemberIds.includes(id),
    );

    if (newParticipantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All selected users are already group members",
      });
    }

    const users = await User.find({
      _id: {
        $in: newParticipantIds,
      },
    });

    if (users.length !== newParticipantIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more users were not found",
      });
    }

    conversation.participants.push(...newParticipantIds);

    await conversation.save();

    await populateConversation(conversation);

    return res.status(200).json({
      success: true,
      message: "Members added successfully",
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error("Add group members error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add group members",
    });
  }
};

// =========================================================
// DELETE /api/conversations/:id/members/:userId
// =========================================================

const removeGroupMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation or user ID",
      });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!isGroupConversation(conversation)) {
      return res.status(400).json({
        success: false,
        message: "Members can only be removed from groups",
      });
    }

    if (!isAdmin(conversation, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only group admins can remove members",
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Use the leave group option to remove yourself",
      });
    }

    const isMember = conversation.participants.some(
      (participant) => participant.toString() === userId,
    );

    if (!isMember) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this group",
      });
    }

    const targetIsAdmin = conversation.admins.some(
      (admin) => admin.toString() === userId,
    );

    if (targetIsAdmin) {
      return res.status(400).json({
        success: false,
        message: "Remove admin privileges before removing this member",
      });
    }

    conversation.participants = conversation.participants.filter(
      (participant) => participant.toString() !== userId,
    );

    await conversation.save();

    await populateConversation(conversation);

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error("Remove group member error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove group member",
    });
  }
};

// =========================================================
// POST /api/conversations/:id/leave
// =========================================================

const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!isGroupConversation(conversation)) {
      return res.status(400).json({
        success: false,
        message: "Only group conversations can be left",
      });
    }

    const isMember = conversation.participants.some(
      (participant) => participant.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    const userIsAdmin = isAdmin(conversation, req.user._id);

    if (userIsAdmin && conversation.admins.length === 1) {
      if (conversation.participants.length > 1) {
        return res.status(400).json({
          success: false,
          message:
            "You are the only admin. Make another member an admin before leaving.",
        });
      }

      // Last remaining member — remove the group completely.
      await Message.deleteMany({
        conversation: conversation._id,
      });

      await Conversation.deleteOne({
        _id: conversation._id,
      });

      return res.status(200).json({
        success: true,
        message: "Group deleted because you were the last member",
        data: {
          deleted: true,
          conversationId: id,
        },
      });
    }

    conversation.participants = conversation.participants.filter(
      (participant) => participant.toString() !== req.user._id.toString(),
    );

    conversation.admins = conversation.admins.filter(
      (admin) => admin.toString() !== req.user._id.toString(),
    );

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "You left the group successfully",
      data: {
        deleted: false,
        conversationId: id,
      },
    });
  } catch (error) {
    console.error("Leave group error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to leave group",
    });
  }
};

// =========================================================
// PATCH /api/conversations/:id
// =========================================================

const updateGroup = async (req, res) => {
  try {
    const { name, description, groupImage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!isGroupConversation(conversation)) {
      return res.status(400).json({
        success: false,
        message: "Only groups can be updated",
      });
    }

    if (!isAdmin(conversation, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only group admins can update group details",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Group name cannot be empty",
        });
      }

      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Group name cannot exceed 100 characters",
        });
      }

      conversation.name = name.trim();
    }

    if (description !== undefined) {
      if (description.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: "Group description cannot exceed 500 characters",
        });
      }

      conversation.description = description.trim();
    }

    if (groupImage !== undefined) {
      conversation.groupImage = groupImage;
    }

    await conversation.save();

    await populateConversation(conversation);

    return res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error("Update group error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update group",
    });
  }
};

// =========================================================
// POST /api/conversations/:id/admins/:userId
// =========================================================

const makeAdmin = async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation or user ID",
      });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!isGroupConversation(conversation)) {
      return res.status(400).json({
        success: false,
        message: "Only groups can have admins",
      });
    }

    if (!isAdmin(conversation, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only group admins can promote members",
      });
    }

    const isMember = conversation.participants.some(
      (participant) => participant.toString() === userId,
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "User must be a group member before becoming an admin",
      });
    }

    const alreadyAdmin = conversation.admins.some(
      (admin) => admin.toString() === userId,
    );

    if (alreadyAdmin) {
      return res.status(400).json({
        success: false,
        message: "User is already an admin",
      });
    }

    conversation.admins.push(userId);

    await conversation.save();

    await populateConversation(conversation);

    return res.status(200).json({
      success: true,
      message: "Member promoted to admin successfully",
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error("Make admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to promote member",
    });
  }
};

// =========================================================
// DELETE /api/conversations/:id/admins/:userId
// =========================================================

const removeAdmin = async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation or user ID",
      });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!isGroupConversation(conversation)) {
      return res.status(400).json({
        success: false,
        message: "Only groups can have admins",
      });
    }

    if (!isAdmin(conversation, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only group admins can remove admin privileges",
      });
    }

    const targetIsAdmin = conversation.admins.some(
      (admin) => admin.toString() === userId,
    );

    if (!targetIsAdmin) {
      return res.status(400).json({
        success: false,
        message: "User is not an admin",
      });
    }

    if (conversation.admins.length === 1) {
      return res.status(400).json({
        success: false,
        message: "A group must have at least one admin",
      });
    }

    conversation.admins = conversation.admins.filter(
      (admin) => admin.toString() !== userId,
    );

    await conversation.save();

    await populateConversation(conversation);

    return res.status(200).json({
      success: true,
      message: "Admin privileges removed successfully",
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error("Remove admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove admin privileges",
    });
  }
};

module.exports = {
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
};
