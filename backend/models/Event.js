import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["blitz", "tournament", "raid", "seasonal"],
      default: "blitz",
    },
    category: { type: String, default: "General" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed"],
      default: "scheduled",
    },
    reward: {
      badge: String,
      xp: Number,
      powerUp: String,
    },
    banner: { type: String },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    maxParticipants: { type: Number, default: 100 },
    metadata: {
      roomCategory: String,
      matchType: {
        type: String,
        enum: ["duel", "team", "raid"],
        default: "duel",
      },
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ startTime: 1, status: 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;


