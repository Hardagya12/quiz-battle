import mongoose from "mongoose";

const gameRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    player1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    player2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["waiting", "starting", "active", "finished"],
      default: "waiting",
    },
    questions: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        player1Answer: {
          answer: String,
          answeredAt: Date,
          points: Number,
        },
        player2Answer: {
          answer: String,
          answeredAt: Date,
          points: Number,
        },
      },
    ],
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    scores: {
      player1: {
        type: Number,
        default: 0,
      },
      player2: {
        type: Number,
        default: 0,
      },
    },
    category: {
      type: String,
      default: "General",
    },
    matchType: {
      type: String,
      enum: ["duel", "team", "raid"],
      default: "duel",
    },
    teams: [
      {
        name: { type: String, default: "Team" },
        color: { type: String, default: "#6366f1" },
        members: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        score: { type: Number, default: 0 },
      },
    ],
    maxPlayers: {
      type: Number,
      default: 2,
      min: 2,
      max: 4,
    },
    raidMeta: {
      bossName: { type: String, default: "Quiz Titan" },
      bossHp: { type: Number, default: 1000 },
      damageDealt: { type: Number, default: 0 },
    },
    startedAt: {
      type: Date,
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
    questionTimeLimit: {
      type: Number,
      default: 20, // seconds
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique room ID
gameRoomSchema.statics.generateRoomId = function () {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const GameRoom = mongoose.model("GameRoom", gameRoomSchema);

export default GameRoom;

