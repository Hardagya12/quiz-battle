import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { CATEGORIES } from "../utils/constants";
import "./Profile.css";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch game history
      const historyResponse = await api.get("/game-rooms/history/me");
      setHistory(historyResponse.data.history || []);

      // Calculate category-wise stats
      const stats = calculateCategoryStats(historyResponse.data.history || []);
      setCategoryStats(stats);
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCategoryStats = (games) => {
    const stats = {};
    
    CATEGORIES.forEach((category) => {
      const categoryGames = games.filter((game) => game.category === category);
      const userGames = categoryGames.map((game) => {
        const userPlayer = game.players.find(
          (p) => p.user._id?.toString() === user.id || p.user.toString() === user.id
        );
        return {
          ...game,
          userScore: userPlayer?.score || 0,
          isWinner: userPlayer?.isWinner || false,
        };
      });

      const wins = userGames.filter((g) => g.isWinner).length;
      const losses = userGames.length - wins;
      const totalScore = userGames.reduce((sum, g) => sum + g.userScore, 0);
      const avgScore = userGames.length > 0 ? totalScore / userGames.length : 0;

      stats[category] = {
        totalGames: userGames.length,
        wins,
        losses,
        winRate: userGames.length > 0 ? (wins / userGames.length) * 100 : 0,
        totalScore,
        avgScore: Math.round(avgScore),
        bestScore: userGames.length > 0 ? Math.max(...userGames.map((g) => g.userScore)) : 0,
      };
    });

    return stats;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalStats = () => {
    const totalGames = user?.stats?.totalGames || 0;
    const wins = user?.stats?.wins || 0;
    const losses = user?.stats?.losses || 0;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    const avgScore = user?.stats?.averageScore || 0;

    return { totalGames, wins, losses, winRate, avgScore };
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  const totalStats = getTotalStats();

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            <span>{user?.username?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="profile-details">
            <h1>{user?.username}</h1>
            <p className="profile-email">{user?.email}</p>
            <div className="profile-badges">
              <span className="badge badge-primary">Level {Math.floor(totalStats.totalGames / 10) + 1}</span>
              {totalStats.winRate >= 70 && <span className="badge badge-gold">Champion</span>}
              {totalStats.totalGames >= 50 && <span className="badge badge-silver">Veteran</span>}
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <button onClick={() => navigate("/")} className="btn btn-outline">
            Home
          </button>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-content">
            <h3>Total Games</h3>
            <p className="stat-value">{totalStats.totalGames}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>Wins</h3>
            <p className="stat-value stat-success">{totalStats.wins}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">😔</div>
          <div className="stat-content">
            <h3>Losses</h3>
            <p className="stat-value stat-danger">{totalStats.losses}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Win Rate</h3>
            <p className="stat-value">{totalStats.winRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Average Score</h3>
            <p className="stat-value">{Math.round(totalStats.avgScore)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>Total Points</h3>
            <p className="stat-value">{user?.stats?.totalPoints || 0}</p>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          Category Analysis
        </button>
        <button
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Match History
        </button>
      </div>

      <div className="profile-content">
        {activeTab === "overview" && (
          <div className="overview-section">
            <div className="overview-card">
              <h2>Performance Overview</h2>
              <div className="win-rate-chart">
                <div className="chart-container">
                  <div
                    className="win-bar"
                    style={{ width: `${totalStats.winRate}%` }}
                  ></div>
                  <div
                    className="loss-bar"
                    style={{ width: `${100 - totalStats.winRate}%` }}
                  ></div>
                </div>
                <div className="chart-labels">
                  <span>Wins: {totalStats.winRate.toFixed(1)}%</span>
                  <span>Losses: {(100 - totalStats.winRate).toFixed(1)}%</span>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Recent Activity</h3>
                {history.length > 0 ? (
                  <div className="activity-list">
                    {history.slice(0, 5).map((game) => {
                      const userPlayer = game.players.find(
                        (p) => p.user._id?.toString() === user.id || p.user.toString() === user.id
                      );
                      const isWinner = userPlayer?.isWinner || false;
                      return (
                        <div key={game._id} className={`activity-item ${isWinner ? "won" : "lost"}`}>
                          <div className="activity-icon">{isWinner ? "🏆" : "😔"}</div>
                          <div className="activity-details">
                            <p>
                              {isWinner ? "Won" : "Lost"} against{" "}
                              {game.players
                                .find((p) => (p.user._id?.toString() !== user.id && p.user.toString() !== user.id))
                                ?.user?.username || "Opponent"}
                            </p>
                            <span className="activity-meta">
                              {game.category} • {userPlayer?.score || 0} pts • {formatDate(game.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-data">No games played yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="categories-section">
            <h2>Category-Wise Performance</h2>
            <div className="category-stats-grid">
              {CATEGORIES.map((category) => {
                const stats = categoryStats[category] || {
                  totalGames: 0,
                  wins: 0,
                  losses: 0,
                  winRate: 0,
                  avgScore: 0,
                  bestScore: 0,
                };

                return (
                  <div key={category} className="category-card">
                    <div className="category-header">
                      <h3>{category}</h3>
                      <span className="category-badge">{stats.totalGames} games</span>
                    </div>
                    <div className="category-stats">
                      <div className="category-stat-item">
                        <span className="stat-label">Win Rate</span>
                        <span className="stat-value">{stats.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="category-stat-item">
                        <span className="stat-label">Wins</span>
                        <span className="stat-value stat-success">{stats.wins}</span>
                      </div>
                      <div className="category-stat-item">
                        <span className="stat-label">Losses</span>
                        <span className="stat-value stat-danger">{stats.losses}</span>
                      </div>
                      <div className="category-stat-item">
                        <span className="stat-label">Avg Score</span>
                        <span className="stat-value">{stats.avgScore}</span>
                      </div>
                      <div className="category-stat-item">
                        <span className="stat-label">Best Score</span>
                        <span className="stat-value stat-highlight">{stats.bestScore}</span>
                      </div>
                    </div>
                    <div className="category-progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${stats.winRate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="history-section">
            <h2>Match History</h2>
            {history.length > 0 ? (
              <div className="history-table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Opponent</th>
                      <th>Your Score</th>
                      <th>Opponent Score</th>
                      <th>Result</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((game) => {
                      const userPlayer = game.players.find(
                        (p) => p.user._id?.toString() === user.id || p.user.toString() === user.id
                      );
                      const opponent = game.players.find(
                        (p) => (p.user._id?.toString() !== user.id && p.user.toString() !== user.id)
                      );
                      const isWinner = userPlayer?.isWinner || false;

                      return (
                        <tr key={game._id} className={isWinner ? "won-row" : "lost-row"}>
                          <td>{formatDate(game.createdAt)}</td>
                          <td>
                            <span className="category-tag">{game.category}</span>
                          </td>
                          <td>{opponent?.user?.username || "Unknown"}</td>
                          <td className="score-cell">{userPlayer?.score || 0}</td>
                          <td className="score-cell">{opponent?.score || 0}</td>
                          <td>
                            <span className={`result-badge ${isWinner ? "winner" : "loser"}`}>
                              {isWinner ? "Won" : "Lost"}
                            </span>
                          </td>
                          <td>{game.duration}s</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-history">
                <p>No games played yet. Start your first battle!</p>
                <button onClick={() => navigate("/")} className="btn btn-primary">
                  Play Now
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

