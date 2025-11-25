import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { CATEGORIES } from "../utils/constants";
import RetroBackground from "../components/RetroBackground";
import Sidebar from "../components/Sidebar";
import { HiUser, HiChartBar, HiClock } from "react-icons/hi2";

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

  const rating = user?.stats?.rating;
  const badges = user?.progression?.badges || [];
  
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
      <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
        <RetroBackground />
        <Sidebar />
        <div className="relative z-10 text-neo-black font-pixel text-2xl animate-pulse">LOADING PROFILE...</div>
      </div>
    );
  }

  const totalStats = getTotalStats();
  const userLevel = getUserLevel();
  const levelProgress = getLevelProgress();

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto relative overflow-hidden">
      <RetroBackground />
      <Sidebar />
      <div className="relative z-10">
        
        {/* Profile Header */}
        <div className="bg-neo-white border-3 border-neo-black shadow-neo-xl p-8 mb-8 relative">
          <div className="flex justify-end gap-4 mb-6 absolute top-4 right-4">
            <button onClick={() => navigate("/")} className="btn btn-outline border-2 border-neo-black text-xs px-3 py-1">
              HOME
            </button>
            <button onClick={handleLogout} className="btn btn-primary text-xs px-3 py-1 bg-neo-primary text-white border-2 border-neo-black shadow-neo-sm hover:shadow-none hover:translate-y-1">
              LOGOUT
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 mt-4">
            <div className="relative">
              <div className="w-32 h-32 bg-neo-bg border-3 border-neo-black flex items-center justify-center text-neo-black text-5xl font-bold shadow-neo">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-3 -right-3 bg-neo-accent text-neo-black px-3 py-1 border-2 border-neo-black text-sm font-bold font-mono uppercase shadow-neo-sm">
                Lvl {userLevel}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold font-pixel text-neo-black mb-2">{user?.username}</h1>
              <p className="text-gray-600 font-mono mb-4">{user?.email}</p>

              <div className="flex gap-2 justify-center md:justify-start mb-4 flex-wrap">
                {totalStats.winRate >= 70 && (
                  <span className="px-3 py-1 bg-neo-accent border-2 border-neo-black text-neo-black text-xs font-bold uppercase">
                    🏆 Champion
                  </span>
                )}
                {totalStats.totalGames >= 50 && (
                  <span className="px-3 py-1 bg-gray-300 border-2 border-neo-black text-neo-black text-xs font-bold uppercase">
                    ⭐ Veteran
                  </span>
                )}
                {totalStats.totalGames >= 100 && (
                  <span className="px-3 py-1 bg-neo-purple border-2 border-neo-black text-neo-black text-xs font-bold uppercase">
                    ⚡ Master
                  </span>
                )}
              </div>

              <div className="w-full bg-gray-200 border-2 border-neo-black h-4 mb-2 relative">
                <div
                  className="bg-neo-green h-full absolute top-0 left-0 border-r-2 border-neo-black"
                  style={{ width: `${levelProgress}%` }}
                ></div>
              </div>
              <p className="text-xs font-mono font-bold text-gray-600 uppercase text-right">{levelProgress}% to Level {userLevel + 1}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total Games", value: totalStats.totalGames, icon: "🎯", color: "text-neo-black" },
            { label: "Wins", value: totalStats.wins, icon: "🏆", color: "text-neo-green" },
            { label: "Losses", value: totalStats.losses, icon: "💀", color: "text-neo-primary" },
            { label: "Win Rate", value: `${totalStats.winRate.toFixed(1)}%`, icon: "📈", color: "text-neo-black" },
            { label: "Avg Score", value: Math.round(totalStats.avgScore), icon: "⭐", color: "text-neo-purple" },
            { label: "Total Points", value: user?.stats?.totalPoints || 0, icon: "💎", color: "text-neo-accent" },
          ].map((stat, i) => (
            <div key={i} className="bg-neo-white p-4 border-3 border-neo-black shadow-neo text-center">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-xs font-bold font-mono text-gray-600 uppercase mb-1">{stat.label}</div>
              <div className={`text-xl font-bold font-pixel ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-neo-white border-3 border-neo-black shadow-neo-xl mb-8">
          <div className="flex border-b-3 border-neo-black bg-neo-bg">
            {["overview", "categories", "history"].map((tab) => (
              <button
                key={tab}
                className={`flex-1 px-6 py-4 font-bold font-mono uppercase transition-all ${
                  activeTab === tab
                    ? "bg-neo-white text-neo-black border-r-3 border-l-3 border-neo-black -mb-[3px] pb-[calc(1rem+3px)] z-10"
                    : "text-gray-500 hover:bg-gray-100 hover:text-neo-black"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === "overview" && (
              <div>
                <h2 className="text-2xl font-bold font-pixel mb-6 text-neo-black">PERFORMANCE OVERVIEW</h2>
                <div className="mb-8">
                  <div className="flex h-12 border-3 border-neo-black mb-4 bg-gray-200">
                    <div
                      className="bg-neo-green flex items-center justify-center text-neo-black font-bold font-mono border-r-3 border-neo-black"
                      style={{ width: `${totalStats.winRate}%` }}
                    >
                      {totalStats.winRate > 15 && `${totalStats.wins} WINS`}
                    </div>
                    <div
                      className="bg-neo-primary flex items-center justify-center text-white font-bold font-mono"
                      style={{ width: `${100 - totalStats.winRate}%` }}
                    >
                      {100 - totalStats.winRate > 15 && `${totalStats.losses} LOSSES`}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold font-pixel mb-4 text-neo-black">RECENT ACTIVITY</h3>
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
                            className={`p-4 border-3 border-neo-black shadow-neo-sm ${
                              isWinner ? "bg-neo-green/20" : "bg-neo-primary/10"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span
                                className={`px-2 py-0.5 border-2 border-neo-black text-xs font-bold uppercase ${
                                  isWinner ? "bg-neo-green text-neo-black" : "bg-neo-primary text-white"
                                }`}
                              >
                                {isWinner ? "VICTORY" : "DEFEAT"}
                              </span>
                              <span className="font-bold font-mono text-neo-black">{userPlayer?.score || 0} PTS</span>
                            </div>
                            <p className="text-neo-black font-bold font-mono mb-2 uppercase text-sm">VS {opponent?.user?.username || "OPPONENT"}</p>
                            <div className="flex gap-4 text-xs font-mono font-bold text-gray-600 uppercase">
                              <span className="px-2 py-1 bg-neo-white border-2 border-neo-black">
                                {game.category}
                              </span>
                              <span className="py-1">{formatDate(game.createdAt)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 font-mono italic">No games played yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "categories" && (
              <div>
                <h2 className="text-2xl font-bold font-pixel mb-6 text-neo-black">CATEGORY STATS</h2>
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
                      <div key={category} className="bg-neo-white p-6 border-3 border-neo-black shadow-neo-sm">
                        <div className="flex justify-between items-center mb-4 border-b-2 border-neo-black pb-2">
                          <h3 className="text-lg font-bold font-pixel text-neo-black uppercase">{category}</h3>
                          <span className="text-xs font-bold font-mono bg-neo-black text-neo-white px-2 py-1">{stats.totalGames} GAMES</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                          <div>
                            <div className="text-xl font-bold font-pixel text-neo-black">{stats.winRate.toFixed(0)}%</div>
                            <div className="text-[10px] font-bold font-mono text-gray-500 uppercase">WIN RATE</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold font-pixel text-neo-green">{stats.wins}</div>
                            <div className="text-[10px] font-bold font-mono text-gray-500 uppercase">WINS</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold font-pixel text-neo-primary">{stats.losses}</div>
                            <div className="text-[10px] font-bold font-mono text-gray-500 uppercase">LOSSES</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold font-pixel text-neo-purple">{stats.avgScore}</div>
                            <div className="text-[10px] font-bold font-mono text-gray-500 uppercase">AVG SCORE</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <h2 className="text-2xl font-bold font-pixel mb-6 text-neo-black">FULL HISTORY</h2>
                {/* Reusing History logic but simplified for tab view */}
                <div className="space-y-4">
                  {history.map((game) => {
                     const userPlayer = game.players.find(
                      (p) => p.user._id?.toString() === user.id || p.user.toString() === user.id
                    );
                    const isWinner = userPlayer?.isWinner || false;
                    return (
                      <div key={game._id} className="border-2 border-neo-black p-4 flex justify-between items-center bg-neo-bg shadow-neo-sm">
                         <div className="flex items-center gap-4">
                            <span className={`text-2xl ${isWinner ? "text-neo-green" : "text-neo-primary"}`}>
                              {isWinner ? "🏆" : "💀"}
                            </span>
                            <div>
                               <p className="font-bold font-mono uppercase text-sm">{game.category}</p>
                               <p className="text-xs text-gray-600">{formatDate(game.createdAt)}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-bold font-pixel text-lg">{userPlayer?.score} PTS</p>
                            <p className={`text-xs font-bold uppercase ${isWinner ? "text-neo-green" : "text-neo-primary"}`}>
                                {isWinner ? "VICTORY" : "DEFEAT"}
                            </p>
                         </div>
                      </div>
                    )
                  })}
                  {history.length === 0 && <p className="text-gray-500 font-mono italic">No match history found.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
