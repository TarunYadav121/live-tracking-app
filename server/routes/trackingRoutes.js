const express = require("express");
const mongoose = require("mongoose");
const TrackingSession = require("../models/TrackingSession");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/save", authMiddleware, async (req, res) => {
  try {
    console.log("SAVE REQUEST BODY:", req.body);
    console.log("AUTH USER:", req.user);

    const { trackingId, userId, route, startTime, endTime } = req.body;

    if (!trackingId) {
      return res.status(400).json({ message: "trackingId is required" });
    }
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (!route || !Array.isArray(route) || route.length === 0) {
      return res.status(400).json({ message: "route must be a non-empty array" });
    }

    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Only vendors can save tracking history" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "userId is not a valid ObjectId" });
    }

    const formattedRoute = route.map((point, index) => {
      if (point !== null && typeof point === "object" && !Array.isArray(point)) {
        const lat = Number(point.lat);
        const lng = Number(point.lng);

        if (isNaN(lat) || isNaN(lng)) {
          throw new Error(
            `Route point at index ${index} has invalid lat/lng: lat=${point.lat} lng=${point.lng}`
          );
        }

        return {
          lat,
          lng,
          time: point.time ? new Date(point.time) : new Date(),
        };
      }

      if (Array.isArray(point)) {
        const lat = Number(point[0]);
        const lng = Number(point[1]);

        if (isNaN(lat) || isNaN(lng)) {
          throw new Error(
            `Route point at index ${index} has invalid lat/lng (array): [${point[0]}, ${point[1]}]`
          );
        }

        return { lat, lng, time: new Date() };
      }

      throw new Error(`Route point at index ${index} is not a valid object or array`);
    });

    console.log("FORMATTED ROUTE (first 3 points):", formattedRoute.slice(0, 3));

    const session = await TrackingSession.create({
      trackingId,
      vendorId: req.user.id,
      userId,
      role: "vendor",
      route: formattedRoute,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime:   endTime   ? new Date(endTime)   : undefined,
      status: "completed",
    });

    console.log("SESSION SAVED:", session._id);

    return res.status(201).json({
      message: "Tracking session saved",
      session,
    });

  } catch (error) {
    console.error("SAVE TRACKING ERROR:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});


router.get("/history", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Only vendors can view tracking history" });
    }

    const sessions = await TrackingSession.find({ vendorId: req.user.id })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(sessions);

  } catch (error) {
    console.error("GET HISTORY ERROR:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});
router.get("/history/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const session = await TrackingSession.findById(req.params.id)
      .populate("userId", "name email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorised to view this session" });
    }

    return res.json(session);

  } catch (error) {
    console.error("GET SESSION ERROR:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});
router.delete("/history/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const session = await TrackingSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorised to delete this session" });
    }

    await TrackingSession.findByIdAndDelete(req.params.id);

    return res.json({ message: "Tracking session deleted" });

  } catch (error) {
    console.error("DELETE SESSION ERROR:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

module.exports = router;
