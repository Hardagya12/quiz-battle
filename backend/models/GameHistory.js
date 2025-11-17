import mongoose from "mongoose";

const gameHistorySchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    players: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        score: {
          type: Number,
          default: 0,
        },
        isWinner: {
          type: Boolean,
          default: false,
        },
      },
    ],
    questions: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        player1Answer: {
          answer: String,
          isCorrect: Boolean,
          points: Number,
          usedPowerup: String,
        },
        player2Answer: {
          answer: String,
          isCorrect: Boolean,
          points: Number,
          usedPowerup: String,
        },
      },
    ],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    highlights: {
      clutchQuestion: { type: Number, default: -1 },
      margin: { type: Number, default: 0 },
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    shareLink: {
      type: String,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    category: {
      type: String,
      default: "General",
    },
    matchType: {
      type: String,
      default: "duel",
    },
    raidMeta: {
      bossHp: Number,
      damageDealt: Number,
      success: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
gameHistorySchema.index({ "players.user": 1, createdAt: -1 });

const GameHistory = mongoose.model("GameHistory", gameHistorySchema);

export default GameHistory;

