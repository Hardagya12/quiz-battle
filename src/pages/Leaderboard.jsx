import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { CATEGORIES } from "../utils/constants";
import "./Leaderboard.css";

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCategory]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = selectedCategory ? { category: selectedCategory } : {};
      const response = await api.get("/game-rooms/leaderboard/top", { params });
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        <button onClick={() => navigate("/")} className="btn btn-secondary">
          Back to Home
        </button>
      </div>

      <div className="category-filter">
        <label htmlFor="category-filter">Filter by Category:</label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading leaderboard...</div>
      ) : (
        <div className="leaderboard-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Total Score</th>
                <th>Wins</th>
                <th>Total Games</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    No data available
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.username === user?.username;
                  const winRate =
                    entry.totalGames > 0
                      ? ((entry.wins / entry.totalGames) * 100).toFixed(1)
                      : "0.0";

                  return (
                    <tr key={index} className={isCurrentUser ? "current-user" : ""}>
                      <td>#{index + 1}</td>
                      <td>
                        {entry.username}
                        {isCurrentUser && <span className="badge">You</span>}
                      </td>
                      <td>{entry.totalScore || 0}</td>
                      <td>{entry.wins || 0}</td>
                      <td>{entry.totalGames || 0}</td>
                      <td>{winRate}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {user && (
        <div className="user-stats-card">
          <h2>Your Stats</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Wins</span>
              <span className="stat-value">{user.stats?.wins || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Losses</span>
              <span className="stat-value">{user.stats?.losses || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Games</span>
              <span className="stat-value">{user.stats?.totalGames || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Score</span>
              <span className="stat-value">
                {user.stats?.averageScore?.toFixed(0) || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

