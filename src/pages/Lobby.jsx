import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";
import "./Lobby.css";

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
      <div className="lobby-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="lobby-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate("/")} className="btn btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  const isPlayer1 = room?.player1?._id?.toString() === user.id || room?.player1?.toString() === user.id;
  const isPlayer2 = room?.player2 && (room.player2._id?.toString() === user.id || room.player2?.toString() === user.id);
  const waitingForOpponent = !room?.player2;

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <h2>Game Lobby</h2>
        <div className="room-info">
          <p>
            <strong>Room Code:</strong> {roomId}
          </p>
          <p>
            <strong>Category:</strong> {room?.category || "General"}
          </p>
        </div>

        <div className="players-list">
          <div className="player-card">
            <h3>Player 1</h3>
            <p>{room?.player1?.username || "You"}</p>
            {isPlayer1 && <span className="badge">You</span>}
          </div>

          <div className="vs-divider">VS</div>

          <div className="player-card">
            <h3>Player 2</h3>
            {waitingForOpponent ? (
              <p className="waiting">Waiting for opponent...</p>
            ) : (
              <>
                <p>{room?.player2?.username}</p>
                {isPlayer2 && <span className="badge">You</span>}
              </>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {waitingForOpponent ? (
          <div className="waiting-section">
            <div className="loading-spinner"></div>
            <p>Share the room code with a friend or wait for a match</p>
            <button onClick={() => navigate("/")} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        ) : (
          <div className="ready-section">
            <p>Both players ready!</p>
            {isPlayer1 && (
              <button onClick={handleStartGame} className="btn btn-primary">
                Start Game
              </button>
            )}
            {!isPlayer1 && <p>Waiting for host to start the game...</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;

