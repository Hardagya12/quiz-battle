import express from "express";
import Event from "../models/Event.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/upcoming", async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      endTime: { $gte: now },
    })
      .sort({ startTime: 1 })
      .limit(5);

    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch events", error: error.message });
  }
});

router.post("/:eventId/register", authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ message: "Event is full" });
    }

    const alreadyRegistered = event.participants.some(
      (participant) => participant.user.toString() === req.user._id.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({ message: "Already registered for this event" });
    }

    event.participants.push({ user: req.user._id });
    await event.save();

    res.json({ message: "Registered successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Failed to register for event", error: error.message });
  }
});

router.get("/:eventId/leaderboard", async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).populate("participants.user", "username stats");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json({
      event,
      leaderboard: event.participants.slice(0, 20),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch leaderboard", error: error.message });
  }
});

export default router;


