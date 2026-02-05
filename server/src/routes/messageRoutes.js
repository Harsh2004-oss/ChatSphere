const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Message = require("../models/Message");
const protect = require("../middleware/auth.middleware");

// ---------------- Cloudinary Config ----------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------- Multer Memory Storage ----------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------- FETCH MESSAGES ----------------
// GET /api/message/:friendId
router.get("/:friendId", protect, async (req, res) => {
  const userId = req.user._id;
  const friendId = req.params.friendId;

  try {
    const messages = await Message.find({
      $or: [
        { from: userId, to: friendId },
        { from: friendId, to: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .select("from to text file fileType createdAt");

    res.json(messages);
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ---------------- UPLOAD IMAGE / VIDEO ----------------
// POST /api/message/upload
// ---------------- UPLOAD IMAGE / VIDEO ----------------
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    const { to, text } = req.body;
    const from = req.user._id;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Upload buffer to Cloudinary
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "chat-media" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(fileBuffer);
      });
    };

    const uploaded = await streamUpload(req.file.buffer);

    if (!uploaded?.secure_url) {
      return res.status(500).json({ error: "Cloudinary upload failed" });
    }

    const fileType = req.file.mimetype.startsWith("video") ? "video" : "image";

    // ✅ Save message properly in MongoDB
    const newMessage = await Message.create({
      from,
      to,
      text: text || "",
      file: uploaded.secure_url, // must be secure_url
      fileType,                  // must match schema
      createdAt: new Date(),
      delivered: false
    });

    res.json(newMessage); // return full message with file URL
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});


module.exports = router;
