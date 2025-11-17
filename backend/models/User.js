import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { POWER_UP_TYPES } from "../utils/constants.js";
import { applyMatchResultToRatings, getDefaultCategoryRatings } from "../utils/rating.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      totalGames: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      totalPoints: { type: Number, default: 0 },
      rating: {
        overall: { type: Number, default: 1200 },
        tier: { type: String, default: "Bronze" },
        tiersUnlocked: { type: [String], default: ["Bronze"] },
        categories: {
          type: Map,
          of: Number,
          default: () => getDefaultCategoryRatings(),
        },
      },
      streak: {
        current: { type: Number, default: 0 },
        best: { type: Number, default: 0 },
        lastWinAt: { type: Date },
      },
    },
    powerUps: {
      type: [
        {
          type: {
            type: String,
            enum: POWER_UP_TYPES,
          },
          quantity: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
    progression: {
      daily: {
        resetAt: { type: Date, default: null },
        quests: [
          {
            id: String,
            description: String,
            target: Number,
            progress: { type: Number, default: 0 },
            reward: {
              powerUp: String,
              xp: Number,
              badge: String,
            },
            completed: { type: Boolean, default: false },
            claimed: { type: Boolean, default: false },
          },
        ],
      },
      weekly: {
        resetAt: { type: Date, default: null },
        quests: [
          {
            id: String,
            description: String,
            target: Number,
            progress: { type: Number, default: 0 },
            reward: {
              powerUp: String,
              xp: Number,
              badge: String,
            },
            completed: { type: Boolean, default: false },
            claimed: { type: Boolean, default: false },
          },
        ],
      },
      seasonPass: {
        level: { type: Number, default: 1 },
        xp: { type: Number, default: 0 },
        nextRewardAt: { type: Number, default: 500 },
      },
      badges: [
        {
          id: String,
          name: String,
          earnedAt: Date,
          equipped: { type: Boolean, default: false },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.ensurePowerUpEntry = function (type) {
  const existing = this.powerUps.find((p) => p.type === type);
  if (!existing) {
    this.powerUps.push({ type, quantity: 0 });
    return this.powerUps[this.powerUps.length - 1];
  }
  return existing;
};

userSchema.methods.grantPowerUp = function (type, quantity = 1) {
  if (!POWER_UP_TYPES.includes(type)) {
    return;
  }
  const entry = this.ensurePowerUpEntry(type);
  entry.quantity += quantity;
};

// Update stats method
userSchema.methods.updateStats = function ({ isWinner, score, category = "General", opponentRating = 1200 }) {
  this.stats.totalGames += 1;
  if (isWinner) {
    this.stats.wins += 1;
    this.stats.streak.current += 1;
    this.stats.streak.lastWinAt = new Date();
    if (this.stats.streak.current > this.stats.streak.best) {
      this.stats.streak.best = this.stats.streak.current;
    }
  } else {
    this.stats.losses += 1;
    this.stats.streak.current = 0;
  }
  this.stats.totalPoints += score;
  this.stats.averageScore = this.stats.totalPoints / this.stats.totalGames;

  applyMatchResultToRatings({
    user: this,
    isWinner,
    opponentRating,
    category,
  });

  // Streak perks
  if (this.stats.streak.current > 0) {
    if (this.stats.streak.current % 3 === 0) {
      this.grantPowerUp("extra_time");
    }
    if (this.stats.streak.current % 5 === 0) {
      this.grantPowerUp("double_points");
    }
    if (this.stats.streak.current % 7 === 0) {
      this.grantPowerUp("skip");
    }
  }

  return this.save();
};

const User = mongoose.model("User", userSchema);

export default User;

