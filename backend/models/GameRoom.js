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
      enum: ["waiting", "active", "finished"],
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

