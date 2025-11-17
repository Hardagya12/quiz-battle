import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";

const Lobby = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await api.get(`/game-rooms/${roomId}`);
        const roomData = response.data.room;
        setRoom(roomData);
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load room");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Socket setup - separate effect
  useEffect(() => {
    if (!socket || !room || !user) return;

    // Join socket room
    socket.emit("join-room", { roomId, userId: user.id });

    // Listen for opponent joining
    socket.on("opponent-joined", ({ player1, player2 }) => {
      setRoom((prev) => ({
        ...prev,
        player1,
        player2,
      }));
    });

    // Listen for game started
    socket.on("game-started", (data) => {
      console.log("Game started event received:", data);
      navigate(`/game/${roomId}`);
    });

    socket.on("error", ({ message }) => {
      setError(message);
    });

    return () => {
      if (socket) {
        socket.off("opponent-joined");
        socket.off("game-started");
        socket.off("error");
      }
    };
  }, [socket, room, roomId, user, navigate]);

  const handleStartGame = () => {
    if (!socket || !room) return;
    const player1Id = room.player1?._id?.toString() || room.player1?.toString();
    if (player1Id !== user.id) {
      setError("Only room creator can start the game");
      return;
    }
    if (!room.player2) {
      setError("Waiting for opponent to join");
      return;
    }
    console.log("Starting game...", { roomId, userId: user.id });
    socket.emit("start-game", { roomId, userId: user.id });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <div className="error-message mb-4">{error}</div>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isPlayer1 = room?.player1?._id?.toString() === user.id || room?.player1?.toString() === user.id;
  const isPlayer2 = room?.player2 && (room.player2._id?.toString() === user.id || room.player2?.toString() === user.id);
  const waitingForOpponent = !room?.player2;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
        <h2 className="text-center mb-6 text-3xl font-bold text-gray-800">Game Lobby</h2>
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center">
          <p className="mb-2 text-lg">
            <strong className="text-indigo-500">Room Code:</strong> <span className="font-mono font-bold">{roomId}</span>
          </p>
          <p className="text-lg">
            <strong className="text-indigo-500">Category:</strong> {room?.category || "General"}
          </p>
        </div>

        <div className="flex items-center justify-around mb-6 gap-4 flex-col md:flex-row">
          <div className="flex-1 bg-gray-50 p-6 rounded-xl text-center border-2 border-gray-200">
            <h3 className="mb-2 text-sm text-gray-600 uppercase font-semibold">Player 1</h3>
            <p className="text-xl font-semibold text-gray-800 flex items-center justify-center gap-2">
              {room?.player1?.username || "You"}
              {isPlayer1 && <span className="badge">You</span>}
            </p>
          </div>

          <div className="text-2xl font-bold text-indigo-500 px-4">VS</div>

          <div className="flex-1 bg-gray-50 p-6 rounded-xl text-center border-2 border-gray-200">
            <h3 className="mb-2 text-sm text-gray-600 uppercase font-semibold">Player 2</h3>
            {waitingForOpponent ? (
              <p className="text-gray-500 italic">Waiting for opponent...</p>
            ) : (
              <p className="text-xl font-semibold text-gray-800 flex items-center justify-center gap-2">
                {room?.player2?.username}
                {isPlayer2 && <span className="badge">You</span>}
              </p>
            )}
          </div>
        </div>

        {error && <div className="error-message mb-4">{error}</div>}

        {waitingForOpponent ? (
          <div className="text-center py-6">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="mb-4 text-gray-600">Share the room code with a friend or wait for a match</p>
            <button onClick={() => navigate("/")} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="mb-4 text-lg text-gray-700">Both players ready!</p>
            {isPlayer1 && (
              <button onClick={handleStartGame} className="btn btn-primary">
                Start Game
              </button>
            )}
            {!isPlayer1 && <p className="text-gray-600">Waiting for host to start the game...</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;

