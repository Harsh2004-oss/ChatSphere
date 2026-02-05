// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
require("dotenv").config();

// 🔹 Models
const Message = require("./src/models/Message");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(cookieParser());

// ✅ CORS for API routes + credentials
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

/* =========================
   TEST ROUTE
========================= */
app.get("/api", (req, res) => {
  res.send("✅ ChatSphere backend is live!");
});

/* =========================
   API ROUTES
========================= */
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/user", require("./src/routes/user.routes"));
app.use("/api/friend-request", require("./src/routes/friendRequestRoutes"));
app.use("/api/message", require("./src/routes/messageRoutes"));

/* =========================
   SERVE REACT FRONTEND (PRODUCTION)
========================= */
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));

  // ✅ catch-all React route
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

/* =========================
   SERVER + SOCKET.IO
========================= */
const server = http.createServer(app);

const io = new Server(server, { cors: corsOptions });

// Map to track online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("user-online", (userId) => {
    socket.userId = userId;
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log("🟢 User online:", userId);
  });

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
      if (onlineUsers.has(to)) {
        onlineUsers.get(to).forEach((socketId) => {
          io.to(socketId).emit("receive-message", payload);
        });
      }
    } catch (err) {
      console.error("❌ Message save error:", err);
    }
  });

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
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB error:", err));
