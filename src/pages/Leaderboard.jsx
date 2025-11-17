import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { CATEGORIES } from "../utils/constants";

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
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto bg-gray-50">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-4xl font-bold text-gray-800">Leaderboard</h1>
        <button onClick={() => navigate("/")} className="btn btn-secondary">
          Back to Home
        </button>
      </div>

      <div className="mb-6 text-center">
        <label htmlFor="category-filter" className="block mb-2 font-semibold text-gray-800">
          Filter by Category:
        </label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 min-w-[200px]"
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
        <div className="bg-white rounded-xl overflow-hidden shadow-lg mb-8">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-indigo-500 text-white">
                <tr>
                  <th className="p-4 text-left font-semibold">Rank</th>
                  <th className="p-4 text-left font-semibold">Username</th>
                  <th className="p-4 text-left font-semibold">Total Score</th>
                  <th className="p-4 text-left font-semibold">Wins</th>
                  <th className="p-4 text-left font-semibold">Total Games</th>
                  <th className="p-4 text-left font-semibold">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
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
                      <tr
                        key={index}
                        className={`border-b border-gray-200 hover:bg-gray-50 ${
                          isCurrentUser ? "bg-indigo-50 font-semibold" : ""
                        }`}
                      >
                        <td className="p-4">#{index + 1}</td>
                        <td className="p-4">
                          <span className="flex items-center gap-2">
                            {entry.username}
                            {isCurrentUser && <span className="badge">You</span>}
                          </span>
                        </td>
                        <td className="p-4">{entry.totalScore || 0}</td>
                        <td className="p-4">{entry.wins || 0}</td>
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
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">Your Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <span className="block text-sm text-gray-600 mb-2 uppercase font-semibold">Wins</span>
              <span className="text-3xl font-bold text-indigo-500">{user.stats?.wins || 0}</span>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <span className="block text-sm text-gray-600 mb-2 uppercase font-semibold">Losses</span>
              <span className="text-3xl font-bold text-red-500">{user.stats?.losses || 0}</span>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <span className="block text-sm text-gray-600 mb-2 uppercase font-semibold">Total Games</span>
              <span className="text-3xl font-bold text-indigo-500">{user.stats?.totalGames || 0}</span>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <span className="block text-sm text-gray-600 mb-2 uppercase font-semibold">Average Score</span>
              <span className="text-3xl font-bold text-indigo-500">
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

