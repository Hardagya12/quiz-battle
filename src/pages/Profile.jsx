import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { CATEGORIES } from "../utils/constants";

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
      const historyResponse = await api.get("/game-rooms/history/me");
      setHistory(historyResponse.data.history || []);

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

  const getUserLevel = () => {
    const totalGames = user?.stats?.totalGames || 0;
    return Math.floor(totalGames / 10) + 1;
  };

  const getLevelProgress = () => {
    const totalGames = user?.stats?.totalGames || 0;
    return (totalGames % 10) * 10;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const totalStats = getTotalStats();
  const userLevel = getUserLevel();
  const levelProgress = getLevelProgress();

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto bg-gray-50">
      <div className="bg-white rounded-2xl p-8 mb-6 shadow-lg">
        <div className="flex justify-end gap-4 mb-6">
          <button onClick={() => navigate("/")} className="btn btn-outline">
            Home
          </button>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          <div className="relative">
            <div className="w-32 h-32 bg-indigo-500 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">
              Lvl {userLevel}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{user?.username}</h1>
            <p className="text-gray-600 mb-4">{user?.email}</p>

            <div className="flex gap-2 justify-center md:justify-start mb-4 flex-wrap">
              {totalStats.winRate >= 70 && (
                <span className="px-3 py-1 bg-yellow-400 text-gray-800 rounded-full text-xs font-semibold">
                  🏆 Champion
                </span>
              )}
              {totalStats.totalGames >= 50 && (
                <span className="px-3 py-1 bg-gray-300 text-gray-800 rounded-full text-xs font-semibold">
                  ⭐ Veteran
                </span>
              )}
              {totalStats.totalGames >= 100 && (
                <span className="px-3 py-1 bg-purple-300 text-gray-800 rounded-full text-xs font-semibold">
                  ⚡ Master
                </span>
              )}
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-indigo-500 h-3 rounded-full transition-all"
                style={{ width: `${levelProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{levelProgress}% to Level {userLevel + 1}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-sm text-gray-600 mb-1">Total Games</div>
          <div className="text-2xl font-bold text-indigo-500">{totalStats.totalGames}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-sm text-gray-600 mb-1">Wins</div>
          <div className="text-2xl font-bold text-green-500">{totalStats.wins}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-sm text-gray-600 mb-1">Losses</div>
          <div className="text-2xl font-bold text-red-500">{totalStats.losses}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <div className="text-3xl mb-2">📈</div>
          <div className="text-sm text-gray-600 mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-indigo-500">{totalStats.winRate.toFixed(1)}%</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <div className="text-3xl mb-2">⭐</div>
          <div className="text-sm text-gray-600 mb-1">Avg Score</div>
          <div className="text-2xl font-bold text-indigo-500">{Math.round(totalStats.avgScore)}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <div className="text-3xl mb-2">💎</div>
          <div className="text-sm text-gray-600 mb-1">Total Points</div>
          <div className="text-2xl font-bold text-indigo-500">{user?.stats?.totalPoints || 0}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === "overview"
                ? "text-indigo-500 border-b-2 border-indigo-500"
                : "text-gray-600 hover:text-indigo-500"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === "categories"
                ? "text-indigo-500 border-b-2 border-indigo-500"
                : "text-gray-600 hover:text-indigo-500"
            }`}
            onClick={() => setActiveTab("categories")}
          >
            Categories
          </button>
          <button
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === "history"
                ? "text-indigo-500 border-b-2 border-indigo-500"
                : "text-gray-600 hover:text-indigo-500"
            }`}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Performance Overview</h2>

              <div className="mb-8">
                <div className="flex h-8 rounded-lg overflow-hidden mb-4">
                  <div
                    className="bg-green-500 flex items-center justify-center text-white font-semibold"
                    style={{ width: `${totalStats.winRate}%` }}
                  >
                    {totalStats.winRate > 10 && `${totalStats.wins} Wins`}
                  </div>
                  <div
                    className="bg-red-500 flex items-center justify-center text-white font-semibold"
                    style={{ width: `${100 - totalStats.winRate}%` }}
                  >
                    {100 - totalStats.winRate > 10 && `${totalStats.losses} Losses`}
                  </div>
                </div>
                <div className="flex justify-around text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-500">{totalStats.winRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Win Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">{(100 - totalStats.winRate).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Loss Rate</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h3>
                {history.length > 0 ? (
                  <div className="space-y-4">
                    {history.slice(0, 5).map((game) => {
                      const userPlayer = game.players.find(
                        (p) => p.user._id?.toString() === user.id || p.user.toString() === user.id
                      );
                      const opponent = game.players.find(
                        (p) => p.user._id?.toString() !== user.id && p.user.toString() !== user.id
                      );
                      const isWinner = userPlayer?.isWinner || false;

                      return (
                        <div
                          key={game._id}
                          className={`p-4 rounded-lg border-l-4 ${
                            isWinner ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                isWinner ? "bg-green-500 text-white" : "bg-red-500 text-white"
                              }`}
                            >
                              {isWinner ? "Victory" : "Defeat"}
                            </span>
                            <span className="font-bold text-gray-800">{userPlayer?.score || 0} pts</span>
                          </div>
                          <p className="text-gray-700 mb-2">vs {opponent?.user?.username || "Opponent"}</p>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                              {game.category}
                            </span>
                            <span>{formatDate(game.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-gray-600 mb-4">No games played yet</p>
                    <button onClick={() => navigate("/")} className="btn btn-primary">
                      Start Your First Battle
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Category Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div key={category} className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{category}</h3>
                        <span className="text-sm text-gray-600">{stats.totalGames} games</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-500">{stats.winRate.toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
                          <div className="text-xs text-gray-600">Wins</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
                          <div className="text-xs text-gray-600">Losses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-500">{stats.avgScore}</div>
                          <div className="text-xs text-gray-600">Avg Score</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4 text-sm text-gray-700">
                        <span>🏆</span>
                        <span>Best: {stats.bestScore} pts</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
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
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Match History</h2>
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((game) => {
                    const userPlayer = game.players.find(
                      (p) => p.user._id?.toString() === user.id || p.user.toString() === user.id
                    );
                    const opponent = game.players.find(
                      (p) => p.user._id?.toString() !== user.id && p.user.toString() !== user.id
                    );
                    const isWinner = userPlayer?.isWinner || false;

                    return (
                      <div
                        key={game._id}
                        className={`p-6 rounded-xl border-l-4 ${
                          isWinner ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`text-3xl ${isWinner ? "text-green-500" : "text-red-500"}`}>
                            {isWinner ? "🏆" : "🎯"}
                          </div>
                          <span
                            className={`text-lg font-semibold ${
                              isWinner ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {isWinner ? "Victory" : "Defeat"}
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-1">Opponent</div>
                          <div className="font-semibold text-gray-800">{opponent?.user?.username || "Unknown"}</div>
                        </div>

                        <div className="flex items-center justify-around mb-4 p-4 bg-white rounded-lg">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">You</div>
                            <div className="text-2xl font-bold text-indigo-500">{userPlayer?.score || 0}</div>
                          </div>
                          <div className="text-xl font-bold text-gray-500">-</div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">Opp</div>
                            <div className="text-2xl font-bold text-indigo-500">{opponent?.score || 0}</div>
                          </div>
                        </div>

                        <div className="flex gap-4 flex-wrap text-sm text-gray-600">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded">
                            {game.category}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded">
                            ⏱️ {game.duration}s
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded">
                            📅 {formatDate(game.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⏰</div>
                  <p className="text-gray-600 mb-4">No match history yet</p>
                  <button onClick={() => navigate("/")} className="btn btn-primary">
                    Play Your First Game
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
