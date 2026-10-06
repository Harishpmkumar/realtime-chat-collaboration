const User = require("../models/User");

// =====================================================
// GET USERS
// GET /api/users
// =====================================================

const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: {
        $ne: req.user._id,
      },
    }).select("name email profileImage about isOnline lastSeen createdAt");

    return res.status(200).json({
      success: true,
      count: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// =====================================================
// SEARCH USERS
// GET /api/users/search?q=harish
// =====================================================

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const searchTerm = q.trim();

    const users = await User.find({
      _id: {
        $ne: req.user._id,
      },

      $or: [
        {
          name: {
            $regex: searchTerm,
            $options: "i",
          },
        },

        {
          email: {
            $regex: searchTerm,
            $options: "i",
          },
        },
      ],
    }).select("name email profileImage about isOnline lastSeen");

    return res.status(200).json({
      success: true,
      count: users.length,

      data: {
        users,
      },
    });
  } catch (error) {
    console.error("Search users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search users",
    });
  }
};

// =====================================================
// GET USER BY ID
// GET /api/users/:id
// =====================================================

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email profileImage about isOnline lastSeen createdAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// =====================================================
// UPDATE PROFILE
// PUT /api/users/profile
// =====================================================

const updateProfile = async (req, res) => {
  try {
    const { name, profileImage, about } = req.body;

    const updates = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (trimmedName.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Name must be at least 2 characters",
        });
      }

      if (trimmedName.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name must not exceed 100 characters",
        });
      }

      updates.name = trimmedName;
    }

    if (profileImage !== undefined) {
      updates.profileImage = String(profileImage).trim();
    }

    if (about !== undefined) {
      const trimmedAbout = String(about).trim();

      if (trimmedAbout.length > 150) {
        return res.status(400).json({
          success: false,
          message: "About must not exceed 150 characters",
        });
      }

      updates.about = trimmedAbout;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select(
      "name email profileImage about isOnline lastSeen createdAt updatedAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",

      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// =====================================================
// UPLOAD PROFILE IMAGE
// POST /api/users/profile/image
// =====================================================

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }

    const profileImage = `${req.protocol}://${req.get(
      "host",
    )}/uploads/profiles/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      message: "Profile image uploaded successfully",

      data: {
        profileImage,
      },
    });
  } catch (error) {
    console.error("Profile image upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload profile image",
    });
  }
};

module.exports = {
  getUsers,
  searchUsers,
  getUserById,
  updateProfile,
  uploadProfileImage,
};
