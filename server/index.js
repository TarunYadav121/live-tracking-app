const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const users = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join-room", ({ trackingId, role }) => {
    socket.join(trackingId);

    users[socket.id] = { trackingId, role };

    console.log(`${role} joined room ${trackingId}`);

    socket.to(trackingId).emit("user-status", {
      role,
      status: "joined",
    });
  });

  socket.on("send-location", (data) => {
    console.log("Location received:", data);
    socket.to(data.trackingId).emit("receive-location", data);
  });

  socket.on("disconnect", () => {
    const userData = users[socket.id];

    if (userData) {
      const { trackingId, role } = userData;

      console.log(`${role} disconnected from room ${trackingId}`);

      socket.to(trackingId).emit("user-status", {
        role,
        status: "disconnected",
      });

      delete users[socket.id];
    } else {
      console.log("Disconnected:", socket.id);
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});