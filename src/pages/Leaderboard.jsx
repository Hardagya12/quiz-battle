import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { CATEGORIES } from "../utils/constants";
import RetroBackground from "../components/RetroBackground";
import Sidebar from "../components/Sidebar";
import { HiTrophy } from "react-icons/hi2";

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
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto relative overflow-hidden">
      <RetroBackground />
      <Sidebar />
      <div className="relative z-10">
        <header className="flex justify-between items-center mb-8 flex-wrap gap-4 bg-neo-white p-6 border-3 border-neo-black shadow-neo">
          <h1 className="text-3xl font-bold font-pixel text-neo-black flex items-center gap-3">
            <HiTrophy className="text-neo-accent" />
            LEADERBOARD
          </h1>
          <button onClick={() => navigate("/")} className="btn btn-secondary">
            BACK TO HOME
          </button>
        </header>

        <div className="mb-6 text-center bg-neo-white p-4 border-3 border-neo-black shadow-neo-sm">
          <label htmlFor="category-filter" className="block mb-2 font-bold font-mono text-neo-black uppercase">
            Filter by Category
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="neo-input max-w-xs mx-auto"
          >
            <option value="">ALL CATEGORIES</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center font-pixel text-xl animate-pulse text-neo-black">LOADING RANKINGS...</div>
        ) : (
          <div className="bg-neo-white border-3 border-neo-black shadow-neo-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-neo-black text-neo-white font-pixel text-xs md:text-sm">
                  <tr>
                    <th className="p-4 text-left">RANK</th>
                    <th className="p-4 text-left">PLAYER</th>
                    <th className="p-4 text-left">SCORE</th>
                    <th className="p-4 text-left">WINS</th>
                    <th className="p-4 text-left">GAMES</th>
                    <th className="p-4 text-left">WIN RATE</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                        No data available for this category.
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
                        <tr
                          key={index}
                          className={`border-b-2 border-neo-black hover:bg-neo-bg transition-colors ${
                            isCurrentUser ? "bg-neo-accent/20 font-bold" : ""
                          }`}
                        >
                          <td className="p-4 font-bold">#{index + 1}</td>
                          <td className="p-4">
                            <span className="flex items-center gap-2">
                              {entry.username}
                              {isCurrentUser && <span className="px-2 py-0.5 bg-neo-black text-neo-white text-xs font-bold uppercase">YOU</span>}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-neo-primary">{entry.totalScore || 0}</td>
                          <td className="p-4 text-neo-green font-bold">{entry.wins || 0}</td>
                          <td className="p-4">{entry.totalGames || 0}</td>
                          <td className="p-4">{winRate}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {user && (
          <div className="mt-8 bg-neo-white p-6 border-3 border-neo-black shadow-neo">
            <h2 className="mb-6 text-xl font-bold font-pixel text-neo-black">YOUR STATS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-neo-bg border-2 border-neo-black shadow-neo-sm">
                <span className="block text-xs font-bold font-mono text-gray-600 mb-2 uppercase">Wins</span>
                <span className="text-3xl font-bold font-pixel text-neo-green">{user.stats?.wins || 0}</span>
              </div>
              <div className="text-center p-4 bg-neo-bg border-2 border-neo-black shadow-neo-sm">
                <span className="block text-xs font-bold font-mono text-gray-600 mb-2 uppercase">Losses</span>
                <span className="text-3xl font-bold font-pixel text-neo-primary">{user.stats?.losses || 0}</span>
              </div>
              <div className="text-center p-4 bg-neo-bg border-2 border-neo-black shadow-neo-sm">
                <span className="block text-xs font-bold font-mono text-gray-600 mb-2 uppercase">Total Games</span>
                <span className="text-3xl font-bold font-pixel text-neo-black">{user.stats?.totalGames || 0}</span>
              </div>
              <div className="text-center p-4 bg-neo-bg border-2 border-neo-black shadow-neo-sm">
                <span className="block text-xs font-bold font-mono text-gray-600 mb-2 uppercase">Avg Score</span>
                <span className="text-3xl font-bold font-pixel text-neo-purple">
                  {user.stats?.averageScore?.toFixed(0) || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
