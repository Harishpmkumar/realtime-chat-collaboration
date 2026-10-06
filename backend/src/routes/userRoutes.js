const express = require("express");

const {
  getUsers,
  searchUsers,
  getUserById,
  updateProfile,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getUsers);

router.get("/search", searchUsers);

router.get("/:id", getUserById);

router.put("/profile", updateProfile);

module.exports = router;
