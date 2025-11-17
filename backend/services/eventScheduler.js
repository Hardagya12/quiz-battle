import Event from "../models/Event.js";
import GameRoom from "../models/GameRoom.js";

const EVENT_SCAN_INTERVAL = 30000; // 30 seconds

const autoSpawnBlitzRoom = async (event) => {
  if (!event.metadata?.matchType) return null;
  const gameRoom = new GameRoom({
    roomId: GameRoom.generateRoomId(),
    player1: event.participants[0]?.user,
    category: event.metadata.roomCategory || event.category,
    matchType: event.metadata.matchType,
    status: "waiting",
  });

  await gameRoom.save();
  return gameRoom;
};

export const initEventScheduler = (io) => {
  const tick = async () => {
    const now = new Date();
    const eventsToActivate = await Event.find({
      status: "scheduled",
      startTime: { $lte: now },
    });

    for (const event of eventsToActivate) {
      event.status = "active";
      await event.save();
      io.emit("event-activated", event);
      if (event.type === "blitz") {
        await autoSpawnBlitzRoom(event);
      }
    }

    const eventsToComplete = await Event.find({
      status: "active",
      endTime: { $lte: now },
    });

    for (const event of eventsToComplete) {
      event.status = "completed";
      await event.save();
      io.emit("event-completed", event);
    }
  };

  setInterval(tick, EVENT_SCAN_INTERVAL);
};


