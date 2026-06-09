const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();
const connectDB = require("./config/db");

connectDB();
const authRoutes = require("./routes/authRoutes");
const trackingRoutes = require("./routes/trackingRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Live Tracking API is running");
});
app.use("/api/auth", authRoutes);
app.use("/api/tracking", trackingRoutes);



const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://live-tracking-app-rho.vercel.app/login",
    methods: ["GET", "POST"],
  },
});

const users = {};
const activeTrackingUsers = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join-room", ({ trackingId, role, userId, name }) => {
    if (role === "user") {
      if (activeTrackingUsers[trackingId]) {
        socket.emit("join-error", {
          message: "This tracking ID is already being used by another user",
        });
        return;
      }

      activeTrackingUsers[trackingId] = userId;
    }

    socket.join(trackingId);

    users[socket.id] = { trackingId, role, userId, name };

    io.to(trackingId).emit("user-status", {
      role,
      userId,
      name,
      status: "joined",
    });
  });
  socket.on("disconnect", () => {
    const user = users[socket.id];

    if (user) {
      if (user.role === "user") {
        delete activeTrackingUsers[user.trackingId];
      }

      socket.to(user.trackingId).emit("user-status", {
        role: user.role,
        userId: user.userId,
        name: user.name,
        status: "disconnected",
      });

      delete users[socket.id];
    }
  });

  socket.on("send-location", (data) => {
    console.log("Location received:", data);
    socket.to(data.trackingId).emit("receive-location", data);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});