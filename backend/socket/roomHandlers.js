import GameRoom from "../models/GameRoom.js";
import User from "../models/User.js";

const matchmakingQueue = [];
const MATCH_TYPES = {
  duel: { maxPlayers: 2 },
  team: { maxPlayers: 4 },
  raid: { maxPlayers: 2 },
};
const BASE_MMR_WINDOW = 150;

const normalizeMatchType = (matchType) => {
  if (matchType && MATCH_TYPES[matchType]) return matchType;
  return "duel";
};

const getUserRatingForCategory = (user, category) => {
  if (!user?.stats?.rating) {
    return 1200;
  }
  if (category && user.stats.rating.categories?.get?.(category)) {
    return user.stats.rating.categories.get(category);
  }
  if (category && user.stats.rating.categories?.[category]) {
    return user.stats.rating.categories[category];
  }
  return user.stats.rating.overall || 1200;
};

export const handleRoomEvents = (io, socket, activeRooms) => {
  // Join room
  socket.on("join-room", async ({ roomId, userId }) => {
    try {
      const gameRoom = await GameRoom.findOne({ roomId })
        .populate("player1", "username")
        .populate("player2", "username");

      if (!gameRoom) {
        return socket.emit("error", { message: "Room not found" });
      }

      // Check if user is authorized
      const player1Id = gameRoom.player1._id?.toString() || gameRoom.player1.toString();
      const player2Id = gameRoom.player2?._id?.toString() || gameRoom.player2?.toString();
      const isPlayer = player1Id === userId || (gameRoom.player2 && player2Id === userId);

      if (!isPlayer) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;

      console.log(`User ${userId} joined room ${roomId}`);

      // Store room in memory for quick access
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, {
          roomId,
          gameRoom,
          timers: {},
          questionStartTime: null,
        });
      }

      socket.emit("room-joined", {
        roomId,
        room: gameRoom,
        message: "Successfully joined room",
      });

      // Notify other player if both are in room
      if (gameRoom.player2) {
        io.to(roomId).emit("opponent-joined", {
          player1: gameRoom.player1,
          player2: gameRoom.player2,
        });
      }
    } catch (error) {
      socket.emit("error", { message: "Failed to join room", error: error.message });
    }
  });

  // Leave room
  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);
    socket.data.roomId = null;
    socket.emit("room-left", { roomId });
  });

  // Create room
  socket.on("create-room", async ({ userId, category, matchType }) => {
    try {
      let roomId;
      let isUnique = false;
      while (!isUnique) {
        roomId = GameRoom.generateRoomId();
        const existing = await GameRoom.findOne({ roomId });
        if (!existing) isUnique = true;
      }

      const normalizedMatchType = normalizeMatchType(matchType);
      const gameRoom = new GameRoom({
        roomId,
        player1: userId,
        category: category || "General",
        matchType: normalizedMatchType,
        maxPlayers: MATCH_TYPES[normalizedMatchType].maxPlayers,
        teams:
          normalizedMatchType === "team"
            ? [
                { name: "Team Ember", color: "#f97316", members: [userId], score: 0 },
                { name: "Team Frost", color: "#38bdf8", members: [], score: 0 },
              ]
            : [],
        raidMeta:
          normalizedMatchType === "raid"
            ? { bossName: "Quiz Titan", bossHp: 1500, damageDealt: 0 }
            : undefined,
      });

      await gameRoom.save();

      socket.emit("room-created", {
        roomId: gameRoom.roomId,
        room: gameRoom,
      });
    } catch (error) {
      socket.emit("error", { message: "Failed to create room", error: error.message });
    }
  });

  // Find match (matchmaking)
  socket.on("find-match", async ({ userId, category, matchType = "duel" }) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return socket.emit("error", { message: "User not found" });
      }
      const normalizedMatchType = normalizeMatchType(matchType);
      const userRating = getUserRatingForCategory(user, category);
      const queueTimestamp = Date.now();

      // Remove user from queue if already there
      const queueIndex = matchmakingQueue.findIndex((entry) => entry.userId === userId);
      if (queueIndex !== -1) {
        matchmakingQueue.splice(queueIndex, 1);
      }

      const matchIndex = matchmakingQueue.findIndex((entry) => {
        if (entry.userId === userId) return false;
        if (normalizedMatchType !== entry.matchType) return false;
        if (category && entry.category !== category) return false;

        const waitSeconds = Math.floor((queueTimestamp - entry.joinedAt) / 1000);
        const dynamicWindow = BASE_MMR_WINDOW + waitSeconds * 20;
        return Math.abs(entry.rating - userRating) <= dynamicWindow;
      });

      if (matchIndex !== -1) {
        // Found a match
        const opponent = matchmakingQueue[matchIndex];
        matchmakingQueue.splice(matchIndex, 1);

        // Create room
        let roomId;
        let isUnique = false;
        while (!isUnique) {
          roomId = GameRoom.generateRoomId();
          const existing = await GameRoom.findOne({ roomId });
          if (!existing) isUnique = true;
        }

        const gameRoom = new GameRoom({
          roomId,
          player1: userId,
          player2: opponent.userId,
          category: category || "General",
          matchType: normalizedMatchType,
          maxPlayers: MATCH_TYPES[normalizedMatchType].maxPlayers,
        });

        await gameRoom.save();

        // Notify both players
        io.to(socket.id).emit("match-found", { roomId, room: gameRoom });
        io.to(opponent.socketId).emit("match-found", { roomId, room: gameRoom });
      } else {
        // Add to queue
        matchmakingQueue.push({
          userId,
          socketId: socket.id,
          category: category || "General",
          matchType: normalizedMatchType,
          rating: userRating,
          joinedAt: queueTimestamp,
        });

        socket.emit("matchmaking-started", { message: "Searching for opponent..." });
      }
    } catch (error) {
      socket.emit("error", { message: "Matchmaking failed", error: error.message });
    }
  });

  // Cancel matchmaking
  socket.on("cancel-matchmaking", ({ userId }) => {
    const queueIndex = matchmakingQueue.findIndex((entry) => entry.userId === userId);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
      socket.emit("matchmaking-cancelled", { message: "Matchmaking cancelled" });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Remove from matchmaking queue
    const queueIndex = matchmakingQueue.findIndex((entry) => entry.socketId === socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
    }

    // Handle room disconnection
    if (socket.data.roomId) {
      const roomId = socket.data.roomId;
      io.to(roomId).emit("player-disconnected", {
        message: "Opponent disconnected",
        roomId,
      });

      // Clean up room from memory after delay
      setTimeout(() => {
        if (activeRooms.has(roomId)) {
          activeRooms.delete(roomId);
        }
      }, 60000); // 1 minute
    }
  });

  return { matchmakingQueue };
};

