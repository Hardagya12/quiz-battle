import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

// Routes
import authRoutes from "./routes/auth.js";
import questionRoutes from "./routes/questions.js";
import gameRoomRoutes from "./routes/gameRooms.js";

// Socket handlers
import { handleRoomEvents } from "./socket/roomHandlers.js";
import { handleGameEvents } from "./socket/gameHandlers.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/quiz-battle")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/game-rooms", gameRoomRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.data.user = user;
    socket.data.userId = user._id.toString();
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket connection handling
const activeRooms = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id, "User:", socket.data.user.username);

  // Initialize room handlers
  handleRoomEvents(io, socket, activeRooms);

  // Initialize game handlers
  handleGameEvents(io, socket, activeRooms);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
