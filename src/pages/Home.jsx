import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";
import { CATEGORIES } from "../utils/constants";
import "./Home.css";

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

  const handleFindMatch = () => {
    if (!socket) {
      setError("Socket not connected");
      return;
    }
    setMatchmaking(true);
    setError("");
    socket.emit("find-match", { userId: user.id, category: selectedCategory });

    socket.on("match-found", ({ roomId }) => {
      setMatchmaking(false);
      navigate(`/lobby/${roomId}`);
    });

    socket.on("error", ({ message }) => {
      setError(message);
      setMatchmaking(false);
    });
  };

  const handleCancelMatchmaking = () => {
    if (socket) {
      socket.emit("cancel-matchmaking", { userId: user.id });
    }
    setMatchmaking(false);
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <h1>Quiz Battle</h1>
        <div className="nav-user">
          <span>Welcome, {user?.username}</span>
          <div className="nav-stats">
            <span>Wins: {user?.stats?.wins || 0}</span>
            <span>Losses: {user?.stats?.losses || 0}</span>
          </div>
          <button onClick={() => navigate("/profile")} className="btn btn-outline">
            Profile
          </button>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </nav>

      <div className="home-content">
        <div className="home-card">
          <h2>Start a Battle</h2>
          {error && <div className="error-message">{error}</div>}

          <div className="category-selector">
            <label htmlFor="category">Select Category:</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={matchmaking || loading}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="game-options">
            <div className="option-card">
              <h3>Quick Match</h3>
              <p>Find an opponent instantly</p>
              {matchmaking ? (
                <div>
                  <div className="loading-spinner"></div>
                  <p>Searching for opponent...</p>
                  <button onClick={handleCancelMatchmaking} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={handleFindMatch} className="btn btn-primary" disabled={loading}>
                  Find Match
                </button>
              )}
            </div>

            <div className="option-card">
              <h3>Create Room</h3>
              <p>Create a room and share the code</p>
              <button
                onClick={handleCreateRoom}
                className="btn btn-primary"
                disabled={loading || matchmaking}
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
            </div>

            <div className="option-card">
              <h3>Join Room</h3>
              <p>Enter a room code to join</p>
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                disabled={loading || matchmaking}
                maxLength={6}
              />
              <button
                onClick={handleJoinRoom}
                className="btn btn-primary"
                disabled={loading || matchmaking}
              >
                {loading ? "Joining..." : "Join Room"}
              </button>
            </div>
          </div>

          <div className="home-links">
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

