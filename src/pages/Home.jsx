import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";
import { CATEGORIES } from "../utils/constants";

const Home = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matchmaking, setMatchmaking] = useState(false);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/game-rooms/create", { category: selectedCategory });
      const roomId = response.data.room.roomId;
      navigate(`/lobby/${roomId}`);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.post(`/game-rooms/join/${roomCode.toUpperCase()}`);
      const roomId = response.data.room.roomId;
      navigate(`/lobby/${roomId}`);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  // Handle socket events for matchmaking
  useEffect(() => {
    if (!socket || !matchmaking) return;

    const handleMatchFound = ({ roomId }) => {
      setMatchmaking(false);
      navigate(`/lobby/${roomId}`);
    };

    const handleMatchmakingError = ({ message }) => {
      setError(message);
      setMatchmaking(false);
    };

    const handleMatchmakingCancelled = () => {
      setMatchmaking(false);
    };

    socket.on("match-found", handleMatchFound);
    socket.on("error", handleMatchmakingError);
    socket.on("matchmaking-cancelled", handleMatchmakingCancelled);

    return () => {
      socket.off("match-found", handleMatchFound);
      socket.off("error", handleMatchmakingError);
      socket.off("matchmaking-cancelled", handleMatchmakingCancelled);
    };
  }, [socket, matchmaking, navigate]);

  const handleFindMatch = () => {
    if (!socket) {
      setError("Socket not connected");
      return;
    }
    setMatchmaking(true);
    setError("");
    socket.emit("find-match", { userId: user.id, category: selectedCategory });
  };

  const handleCancelMatchmaking = () => {
    if (socket) {
      socket.emit("cancel-matchmaking", { userId: user.id });
    }
    setMatchmaking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 relative overflow-hidden">
      <nav className="bg-white/95 backdrop-blur-sm p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              🏆
            </div>
            <h1 className="text-indigo-500 text-2xl font-bold">Quiz Battle</h1>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-gray-800">Welcome, {user?.username}</div>
                <div className="flex gap-2 text-xs text-gray-600">
                  <span>Wins: {user?.stats?.wins || 0}</span>
                  <span>Losses: {user?.stats?.losses || 0}</span>
                </div>
              </div>
            </div>
            <button onClick={() => navigate("/profile")} className="btn btn-outline">
              Profile
            </button>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8 text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">Challenge</span> Your Mind
          </h2>
          <p className="text-xl text-white/90">Compete in real-time trivia battles with players worldwide</p>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
          {error && <div className="error-message">{error}</div>}

          <div className="mb-6 text-center">
            <label htmlFor="category" className="block mb-3 font-semibold text-gray-800">
              Select Your Battle Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={matchmaking || loading}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-indigo-500 min-w-[200px]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-6 rounded-xl text-center border-2 border-gray-200 hover:border-indigo-500 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Quick Match</h3>
              <p className="text-sm text-gray-600 mb-4">Jump into instant action</p>
              {matchmaking ? (
                <div>
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600 mb-4">Finding opponent...</p>
                  <button onClick={handleCancelMatchmaking} className="btn btn-secondary text-sm">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={handleFindMatch} className="btn btn-primary w-full" disabled={loading}>
                  Find Match
                </button>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-xl text-center border-2 border-gray-200 hover:border-indigo-500 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Create Room</h3>
              <p className="text-sm text-gray-600 mb-4">Invite friends with a code</p>
              <button
                onClick={handleCreateRoom}
                className="btn btn-primary w-full"
                disabled={loading || matchmaking}
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl text-center border-2 border-gray-200 hover:border-indigo-500 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Join Room</h3>
              <p className="text-sm text-gray-600 mb-4">Enter a room code</p>
              <input
                type="text"
                placeholder="ROOM CODE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                disabled={loading || matchmaking}
                maxLength={6}
                className="w-full px-4 py-3 mb-4 border-2 border-gray-200 rounded-lg text-center text-lg font-bold tracking-widest focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleJoinRoom}
                className="btn btn-primary w-full"
                disabled={loading || matchmaking || !roomCode.trim()}
              >
                {loading ? "Joining..." : "Join Room"}
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <button onClick={() => navigate("/profile")} className="btn btn-outline">
              My Profile
            </button>
            <button onClick={() => navigate("/leaderboard")} className="btn btn-outline">
              Leaderboard
            </button>
            <button onClick={() => navigate("/history")} className="btn btn-outline">
              Game History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
