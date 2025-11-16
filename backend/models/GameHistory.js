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
        },
        player2Answer: {
          answer: String,
          isCorrect: Boolean,
          points: Number,
        },
      },
    ],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    category: {
      type: String,
      default: "General",
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

