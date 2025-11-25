import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";
import RetroBackground from "../components/RetroBackground";
import Sidebar from "../components/Sidebar";
import { HiUser, HiLightningBolt } from "react-icons/hi";

const Lobby = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

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
      <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
        <RetroBackground />
        <Sidebar />
        <div className="relative z-10 text-neo-black font-pixel text-2xl animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
        <RetroBackground />
        <Sidebar />
        <div className="bg-neo-white p-8 border-3 border-neo-black shadow-neo-xl max-w-md w-full text-center relative z-10">
          <div className="font-mono text-red-500 font-bold mb-4">{error}</div>
          <button onClick={() => navigate("/")} className="btn btn-primary w-full">
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  const isPlayer1 = room?.player1?._id?.toString() === user.id || room?.player1?.toString() === user.id;
  const isPlayer2 = room?.player2 && (room.player2._id?.toString() === user.id || room.player2?.toString() === user.id);
  const waitingForOpponent = !room?.player2;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      <RetroBackground />
      <Sidebar />
      
      <div className="bg-neo-white border-3 border-neo-black shadow-neo-xl p-8 max-w-3xl w-full relative z-10">
        <header className="text-center mb-8 border-b-3 border-neo-black pb-4">
          <h2 className="text-3xl font-pixel text-neo-black mb-2">GAME LOBBY</h2>
          <div className="flex justify-center gap-4 text-sm font-mono font-bold uppercase">
            <span className="bg-neo-bg px-3 py-1 border-2 border-neo-black">
              Code: {roomId}
            </span>
            <span className="bg-neo-accent px-3 py-1 border-2 border-neo-black">
              {room?.category || "General"}
            </span>
          </div>
        </header>

        <div className="flex items-center justify-around mb-8 gap-6 flex-col md:flex-row">
          {/* Player 1 Card */}
          <div className="flex-1 w-full bg-neo-bg p-6 border-3 border-neo-black shadow-neo text-center relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neo-primary text-white px-3 py-1 border-2 border-neo-black font-pixel text-xs">
              PLAYER 1
            </div>
            <div className="mt-4">
              <HiUser className="text-6xl mx-auto mb-2 text-neo-black" />
              <p className="text-xl font-bold font-mono text-neo-black truncate">
                {room?.player1?.username || "You"}
              </p>
              {isPlayer1 && <span className="inline-block mt-2 px-2 py-0.5 bg-neo-black text-neo-white text-xs font-bold uppercase">YOU</span>}
            </div>
          </div>

          <div className="text-4xl font-pixel text-neo-black animate-pulse">VS</div>

          {/* Player 2 Card */}
          <div className="flex-1 w-full bg-neo-bg p-6 border-3 border-neo-black shadow-neo text-center relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neo-secondary text-neo-black px-3 py-1 border-2 border-neo-black font-pixel text-xs">
              PLAYER 2
            </div>
            <div className="mt-4">
              {waitingForOpponent ? (
                <div className="animate-pulse">
                  <div className="w-16 h-16 mx-auto mb-2 border-2 border-dashed border-neo-black rounded-full flex items-center justify-center">
                    <span className="text-2xl">?</span>
                  </div>
                  <p className="text-sm font-mono text-gray-500 italic">Waiting...</p>
                </div>
              ) : (
                <>
                  <HiUser className="text-6xl mx-auto mb-2 text-neo-black" />
                  <p className="text-xl font-bold font-mono text-neo-black truncate">
                    {room?.player2?.username}
                  </p>
                  {isPlayer2 && <span className="inline-block mt-2 px-2 py-0.5 bg-neo-black text-neo-white text-xs font-bold uppercase">YOU</span>}
                </>
              )}
            </div>
          </div>
        </div>

        {error && <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 mb-6 font-mono text-sm font-bold text-center">{error}</div>}

        <div className="text-center">
          {waitingForOpponent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 font-mono text-neo-black">
                <span className="animate-spin">⟳</span>
                <span>Waiting for opponent to join...</span>
              </div>
              <p className="text-sm font-mono text-gray-600">Share room code: <span className="font-bold select-all">{roomId}</span></p>
              <button onClick={() => navigate("/")} className="btn btn-outline border-2 border-neo-black hover:bg-neo-black hover:text-neo-white">
                CANCEL
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xl font-pixel text-neo-green mb-4">READY TO FIGHT!</p>
              {isPlayer1 ? (
                <button 
                  onClick={handleStartGame} 
                  className="btn btn-primary text-lg px-10 py-4 shadow-neo hover:shadow-neo-lg hover:-translate-y-1"
                >
                  START BATTLE
                </button>
              ) : (
                <p className="font-mono text-neo-black animate-pulse">Waiting for host to start...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
