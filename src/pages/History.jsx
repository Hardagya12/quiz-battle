import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

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
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto bg-gray-50">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-4xl font-bold text-gray-800">Game History</h1>
        <button onClick={() => navigate("/")} className="btn btn-secondary">
          Back to Home
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-lg text-center">
          <p className="mb-6 text-xl text-gray-600">No games played yet. Start your first battle!</p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Play Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((game) => {
            const userPlayer = game.players.find(
              (p) => p.user._id?.toString() === user.id || p.user.toString() === user.id
            );
            const opponent = game.players.find(
              (p) => p.user._id?.toString() !== user.id && p.user.toString() !== user.id
            );
            const isWinner = game.winner && (game.winner._id?.toString() === user.id || game.winner.toString() === user.id);

            return (
              <div
                key={game._id}
                className={`bg-white p-6 rounded-xl shadow-lg border-l-4 transition-all hover:-translate-y-1 hover:shadow-xl ${
                  isWinner ? "border-green-500" : "border-red-500"
                }`}
              >
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isWinner
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {isWinner ? "Won" : "Lost"}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(game.createdAt)}</span>
                  </div>
                  <span className="px-3 py-1 bg-indigo-500 text-white rounded-full text-xs font-semibold">
                    {game.category}
                  </span>
                </div>

                <div className="flex items-center justify-around mb-4 p-4 bg-gray-50 rounded-lg flex-col md:flex-row gap-4">
                  <div className="text-center">
                    <p className="font-semibold text-gray-800 mb-1">{userPlayer?.user?.username || "You"}</p>
                    <p className="text-2xl font-bold text-indigo-500">{userPlayer?.score || 0} pts</p>
                  </div>
                  <span className="text-xl font-bold text-gray-500">VS</span>
                  <div className="text-center">
                    <p className="font-semibold text-gray-800 mb-1">{opponent?.user?.username || "Opponent"}</p>
                    <p className="text-2xl font-bold text-indigo-500">{opponent?.score || 0} pts</p>
                  </div>
                </div>

                <div className="flex justify-around pt-4 border-t border-gray-200 text-sm text-gray-600">
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

