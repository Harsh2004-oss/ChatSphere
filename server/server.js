const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// 🔹 Models
const Message = require("./src/models/Message");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
     origin: process.env.CLIENT_URL, // <- your Vercel frontend URL
  credentials: true,       
  })
);

/* =========================
   ROUTES
========================= */
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/user", require("./src/routes/user.routes"));
app.use("/api/friend-request", require("./src/routes/friendRequestRoutes"));
app.use("/api/message", require("./src/routes/messageRoutes"));

/* =========================
   SERVER + SOCKET
========================= */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://chat-sphere-6l9f.vercel.app/",
    credentials: true,
  },
});

/* =========================
   ONLINE USERS
   Map<userId, Set<socketId>>
   Allows multiple devices per user
========================= */
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  /* =========================
     USER ONLINE
  ========================== */
  socket.on("user-online", (userId) => {
    socket.userId = userId;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast all online users
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log("🟢 User online:", userId);
  });

  /* =========================
     SEND MESSAGE
     → Only send to receiver sockets
  ========================== */
  socket.on("send-message", async (msg) => {
    const { from, to, text, file, fileType } = msg;

    try {
      const savedMessage = await Message.create({
        from,
        to,
        text,
        file,
        fileType,
        createdAt: new Date(),
      });

      const payload = savedMessage.toObject();

      // 🔹 Send to RECEIVER (all their sockets)
      if (onlineUsers.has(to)) {
        onlineUsers.get(to).forEach((socketId) => {
          io.to(socketId).emit("receive-message", payload);
        });
      }

      // ✅ Do NOT send back to sender — sender already adds locally
    } catch (err) {
      console.error("❌ Message save error:", err);
    }
  });

  /* =========================
     TYPING INDICATOR
  ========================== */
  socket.on("typing", ({ to }) => {
    if (onlineUsers.has(to)) {
      onlineUsers.get(to).forEach((socketId) => {
        io.to(socketId).emit("typing", { from: socket.userId });
      });
    }
  });

  socket.on("stop-typing", ({ to }) => {
    if (onlineUsers.has(to)) {
      onlineUsers.get(to).forEach((socketId) => {
        io.to(socketId).emit("stop-typing", { from: socket.userId });
      });
    }
  });

  /* =========================
     DISCONNECT
  ========================== */
  socket.on("disconnect", () => {
    if (socket.userId && onlineUsers.has(socket.userId)) {
      onlineUsers.get(socket.userId).delete(socket.id);

      if (onlineUsers.get(socket.userId).size === 0) {
        onlineUsers.delete(socket.userId);
      }

      io.emit("online-users", Array.from(onlineUsers.keys()));
      console.log("🔴 User offline:", socket.userId);
    }
  });
});

/* =========================
   DB + SERVER START
========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(5000, () => {
      console.log("🚀 Server running on port 5000");
    });
  })
  .catch((err) => console.error("❌ MongoDB error:", err));
