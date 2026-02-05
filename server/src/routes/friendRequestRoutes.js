const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const {
  sendFriendRequest,
  getPendingRequests,
  getSentRequests,
  getFriends,
  acceptRequest,
  declineRequest
} = require("../controllers/friendRequestController");

// Send a friend request
router.post("/:id", protect, sendFriendRequest);

// Get all accepted friends
router.get("/friends", protect, getFriends);

// Get pending friend requests
router.get("/pending", protect, getPendingRequests);

// Get sent requests
router.get("/sent", protect, getSentRequests);

// Accept a friend request
router.post("/:id/accept", protect, acceptRequest);

// Decline a friend request
router.post("/:id/decline", protect, declineRequest);

module.exports = router;
