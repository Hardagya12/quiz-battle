import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import RetroBackground from "../components/RetroBackground";
import Sidebar from "../components/Sidebar";
import { HiClock } from "react-icons/hi2";

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
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto relative overflow-hidden">
      <RetroBackground />
      <Sidebar />
      <div className="relative z-10">
        <header className="flex justify-between items-center mb-8 flex-wrap gap-4 bg-neo-white p-6 border-3 border-neo-black shadow-neo">
          <h1 className="text-3xl font-bold font-pixel text-neo-black flex items-center gap-3">
            <HiClock className="text-neo-purple" />
            BATTLE HISTORY
          </h1>
          <button onClick={() => navigate("/")} className="btn btn-secondary">
            BACK TO HOME
          </button>
        </header>

        {loading ? (
          <div className="text-center font-pixel text-xl animate-pulse text-neo-black">LOADING HISTORY...</div>
        ) : history.length === 0 ? (
          <div className="bg-neo-white p-12 border-3 border-neo-black shadow-neo-xl text-center">
            <p className="mb-6 text-xl font-mono text-neo-black">No games played yet. Start your first battle!</p>
            <button onClick={() => navigate("/")} className="btn btn-primary">
              PLAY NOW
            </button>
          </div>
        ) : (
          <div className="space-y-6">
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
                  className={`bg-neo-white p-6 border-3 border-neo-black shadow-neo transition-all hover:-translate-y-1 hover:shadow-neo-lg relative overflow-hidden`}
                >
                  {/* Status Strip */}
                  <div className={`absolute top-0 left-0 w-2 h-full ${isWinner ? "bg-neo-green" : "bg-neo-primary"}`} />

                  <div className="flex justify-between items-center mb-4 flex-wrap gap-4 pl-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span
                        className={`px-3 py-1 border-2 border-neo-black text-xs font-bold uppercase ${
                          isWinner
                            ? "bg-neo-green text-neo-black"
                            : "bg-neo-primary text-white"
                        }`}
                      >
                        {isWinner ? "VICTORY" : "DEFEAT"}
                      </span>
                      <span className="text-sm font-mono text-gray-600 font-bold">{formatDate(game.createdAt)}</span>
                    </div>
                    <span className="px-3 py-1 bg-neo-accent border-2 border-neo-black text-neo-black text-xs font-bold uppercase">
                      {game.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-around mb-4 p-4 bg-neo-bg border-2 border-neo-black flex-col md:flex-row gap-4 mx-4">
                    <div className="text-center">
                      <p className="font-bold font-mono text-neo-black mb-1 uppercase text-sm">{userPlayer?.user?.username || "You"}</p>
                      <p className="text-2xl font-bold font-pixel text-neo-black">{userPlayer?.score || 0}</p>
                    </div>
                    <span className="text-xl font-bold font-pixel text-neo-black">VS</span>
                    <div className="text-center">
                      <p className="font-bold font-mono text-neo-black mb-1 uppercase text-sm">{opponent?.user?.username || "Opponent"}</p>
                      <p className="text-2xl font-bold font-pixel text-gray-600">{opponent?.score || 0}</p>
                    </div>
                  </div>

                  <div className="flex justify-around pt-4 border-t-2 border-dashed border-gray-300 text-sm font-mono font-bold text-gray-600 pl-4">
                    <span>DURATION: {game.duration}s</span>
                    <span>QUESTIONS: {game.questions?.length || 10}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
