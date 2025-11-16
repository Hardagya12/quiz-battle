import express from "express";
import GameRoom from "../models/GameRoom.js";
import GameHistory from "../models/GameHistory.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Create game room
router.post("/create", authenticate, async (req, res) => {
  try {
    const { category } = req.body;

    let roomId;
    let isUnique = false;
    while (!isUnique) {
      roomId = GameRoom.generateRoomId();
      const existing = await GameRoom.findOne({ roomId });
      if (!existing) isUnique = true;
    }

    const gameRoom = new GameRoom({
      roomId,
      player1: req.user._id,
      category: category || "General",
    });

    await gameRoom.save();

    res.status(201).json({
      message: "Game room created",
      room: {
        roomId: gameRoom.roomId,
        status: gameRoom.status,
        player1: gameRoom.player1,
        category: gameRoom.category,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Join game room
router.post("/join/:roomId", authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const gameRoom = await GameRoom.findOne({ roomId }).populate("player1", "username");

    if (!gameRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (gameRoom.status !== "waiting") {
      return res.status(400).json({ message: "Room is not available" });
    }

    if (gameRoom.player1.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot join your own room" });
    }

    if (gameRoom.player2) {
      return res.status(400).json({ message: "Room is full" });
    }

    gameRoom.player2 = req.user._id;
    await gameRoom.save();

    res.json({
      message: "Joined room successfully",
      room: {
        roomId: gameRoom.roomId,
        status: gameRoom.status,
        player1: gameRoom.player1,
        player2: gameRoom.player2,
        category: gameRoom.category,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get room status
router.get("/:roomId", authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const gameRoom = await GameRoom.findOne({ roomId })
      .populate("player1", "username")
      .populate("player2", "username");

    if (!gameRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is part of this room
    const isPlayer1 = gameRoom.player1.toString() === req.user._id.toString();
    const isPlayer2 = gameRoom.player2 && gameRoom.player2.toString() === req.user._id.toString();
    const isPlayer = isPlayer1 || isPlayer2;

    // Allow access if:
    // 1. User is already a player in the room (player1 or player2), OR
    // 2. Room is waiting and user is not player1 (so they can view the room before joining)
    if (!isPlayer && !(gameRoom.status === "waiting" && !isPlayer1)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ room: gameRoom });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user's game history
router.get("/history/me", authenticate, async (req, res) => {
  try {
    const history = await GameHistory.find({
      "players.user": req.user._id,
    })
      .populate("players.user", "username")
      .populate("winner", "username")
      .populate("questions.question")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ history, count: history.length });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get leaderboard
router.get("/leaderboard/top", async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    const query = {};
    if (category) {
      query.category = category;
    }

    const topGames = await GameHistory.find(query)
      .populate("players.user", "username stats")
      .sort({ "players.score": -1 })
      .limit(parseInt(limit));

    // Aggregate user stats
    const userStats = await GameHistory.aggregate([
      ...(category ? [{ $match: { category } }] : []),
      { $unwind: "$players" },
      {
        $group: {
          _id: "$players.user",
          totalScore: { $sum: "$players.score" },
          wins: { $sum: { $cond: ["$players.isWinner", 1, 0] } },
          totalGames: { $sum: 1 },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          username: "$user.username",
          totalScore: 1,
          wins: 1,
          totalGames: 1,
        },
      },
    ]);

    res.json({ leaderboard: userStats });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;

