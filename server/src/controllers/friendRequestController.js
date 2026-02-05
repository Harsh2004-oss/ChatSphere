// controllers/friendRequestController.js
const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");

// 🔹 Send Friend Request
const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.id;

    if (senderId === receiverId) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent duplicate requests
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return res.status(400).json({ message: "Friend request already pending" });
      } else if (existingRequest.status === "accepted") {
        return res.status(400).json({ message: "You are already friends" });
      }
    }

    const request = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
    });

    res.status(201).json({ message: "Friend request sent", request });
  } catch (err) {
    console.error("Send Friend Request Error:", err);
    res.status(500).json({ message: "Failed to send friend request" });
  }
};

// 🔹 Get Pending Requests (for receiver)
const getPendingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user.id,
      status: "pending",
    }).populate("sender", "username email avatar");

    res.status(200).json(requests);
  } catch (err) {
    console.error("Get Pending Requests Error:", err);
    res.status(500).json({ message: "Failed to fetch pending requests" });
  }
};

// 🔹 Get Sent Requests (for sender)
const getSentRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("receiver", "username email avatar");

    res.status(200).json(requests);
  } catch (err) {
    console.error("Get Sent Requests Error:", err);
    res.status(500).json({ message: "Failed to fetch sent requests" });
  }
};

// 🔹 Get Friends (only accepted requests)
// 🔹 Get Friends (accepted requests)

const getFriends = async (req, res) => {
  try {
    const friends = await FriendRequest.find({
      $or: [
        { sender: req.user.id, status: "accepted" },
        { receiver: req.user.id, status: "accepted" }
      ]
    }).populate("sender receiver", "username avatar");

    // Map to get the other user in the friend request
    const friendList = friends.map(f => {
      return f.sender._id.toString() === req.user.id
        ? f.receiver
        : f.sender;
    });

    res.status(200).json(friendList); // This will be an array of users
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch friends" });
  }
};
// 🔹 Accept Friend Request
const acceptRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    request.status = "accepted";
    await request.save();

    res.json({ message: "Friend request accepted", request });
  } catch (err) {
    console.error("Accept Request Error:", err);
    res.status(500).json({ message: "Failed to accept request" });
  }
};

// 🔹 Decline Friend Request
const declineRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    request.status = "rejected";
    await request.save();

    res.json({ message: "Friend request declined", request });
  } catch (err) {
    console.error("Decline Request Error:", err);
    res.status(500).json({ message: "Failed to decline request" });
  }
};

module.exports = {
  sendFriendRequest,
  getPendingRequests,
  getSentRequests,
  getFriends,
  acceptRequest,
  declineRequest,
};
