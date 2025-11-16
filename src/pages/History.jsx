import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import "./History.css";

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get("/game-rooms/history/me");
      setHistory(response.data.history || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Game History</h1>
        <button onClick={() => navigate("/")} className="btn btn-secondary">
          Back to Home
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="no-history">
          <p>No games played yet. Start your first battle!</p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Play Now
          </button>
        </div>
      ) : (
        <div className="history-list">
          {history.map((game) => {
            const userPlayer = game.players.find(
              (p) => p.user._id?.toString() === user.id || p.user.toString() === user.id
            );
            const opponent = game.players.find(
              (p) => p.user._id?.toString() !== user.id && p.user.toString() !== user.id
            );
            const isWinner = game.winner && (game.winner._id?.toString() === user.id || game.winner.toString() === user.id);

            return (
              <div key={game._id} className={`history-item ${isWinner ? "won" : "lost"}`}>
                <div className="history-header-item">
                  <div className="history-result">
                    <span className={`result-badge ${isWinner ? "winner" : "loser"}`}>
                      {isWinner ? "Won" : "Lost"}
                    </span>
                    <span className="history-date">{formatDate(game.createdAt)}</span>
                  </div>
                  <div className="history-category">{game.category}</div>
                </div>

                <div className="history-scores">
                  <div className="history-player">
                    <span className="player-name">{userPlayer?.user?.username || "You"}</span>
                    <span className="player-score">{userPlayer?.score || 0} pts</span>
                  </div>
                  <span className="vs">VS</span>
                  <div className="history-player">
                    <span className="player-name">{opponent?.user?.username || "Opponent"}</span>
                    <span className="player-score">{opponent?.score || 0} pts</span>
                  </div>
                </div>

                <div className="history-details">
                  <span>Duration: {game.duration}s</span>
                  <span>Questions: {game.questions?.length || 10}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;

