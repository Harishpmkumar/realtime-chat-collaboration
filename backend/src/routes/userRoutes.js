const express = require("express");

const {
  getUsers,
  searchUsers,
  getUserById,
  updateProfile,
  uploadProfileImage,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

const {
  uploadProfileImage: uploadProfileImageMiddleware,
} = require("../middleware/profileImageUploadMiddleware");

const router = express.Router();

router.use(authMiddleware);

// =====================================================
// USERS
// =====================================================

router.get("/", getUsers);

router.get("/search", searchUsers);

// =====================================================
// CURRENT USER PROFILE
// These routes MUST stay before /:id.
// =====================================================

router.post("/profile/image", uploadProfileImageMiddleware, uploadProfileImage);

router.put("/profile", updateProfile);

// =====================================================
// USER BY ID
// =====================================================

router.get("/:id", getUserById);

module.exports = router;
