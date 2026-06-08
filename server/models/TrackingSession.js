const mongoose = require("mongoose");

const trackingSessionSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    role: {
      type: String,
      enum: ["user", "vendor"],
      required: true,
    },
    route: [
      {
        lat: Number,
        lng: Number,
        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrackingSession", trackingSessionSchema);