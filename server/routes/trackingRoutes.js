const express = require("express");
const TrackingSession = require("../models/TrackingSession");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/save", authMiddleware, async (req, res) => {
  try {
    const { trackingId, userId, route, startTime, endTime } = req.body;

    if (!trackingId || !userId || !route || route.length === 0) {
      return res.status(400).json({ message: "Tracking data is required" });
    }

    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Only vendor can save tracking history" });
    }

    const formattedRoute = route.map((point) => ({
      lat: point[0],
      lng: point[1],
      time: new Date(),
    }));

    const session = await TrackingSession.create({
      trackingId,
      vendorId: req.user.id,
      userId,
      role: "vendor",
      route: formattedRoute,
      startTime,
      endTime,
      status: "completed",
    });

    res.status(201).json({
      message: "Tracking session saved",
      session,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/history", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({
        message: "Only vendors can view tracking history",
      });
    }

    const sessions = await TrackingSession.find({
      vendorId: req.user.id,
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});
router.get("/history/:id", authMiddleware, async (req, res) => {
  try {
    const session = await TrackingSession.findById(req.params.id)
      .populate("userId", "name email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;