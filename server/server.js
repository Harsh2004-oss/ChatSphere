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

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // frontend URL (Vercel)
    credentials: true,                // needed for cookies
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
   SERVE VITE FRONTEND
========================= */
const clientDistPath = path.join(__dirname, "../Client/dist"); // adjust if needed
app.use(express.static(clientDistPath));

// Catch-all for React Router
app.get("/*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

/* =========================
   SERVER + SOCKET
========================= */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

/* =========================
   ONLINE USERS
========================= */
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("user-online", (userId) => {
    socket.userId = userId;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
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
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB error:", err));
