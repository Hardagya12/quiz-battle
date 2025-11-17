// Home.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";
import { CATEGORIES, MATCH_TYPES, POWER_UPS, TIERS } from "../utils/constants";

// Framer Motion for extra buttery smooth motion effects (optional but recommended)
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("General");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [matchmaking, setMatchmaking] = useState(false);
  const [matchType, setMatchType] = useState("duel");
  const [trendingCategories, setTrendingCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [quests, setQuests] = useState([]);
  const [isStartingQuickMatch, setIsStartingQuickMatch] = useState(false);

  const userTier = useMemo(() => {
    const tierName = user?.stats?.rating?.tier || "Bronze";
    return TIERS.find((tier) => tier.name === tierName) || TIERS[0];
  }, [user]);

  const powerUpInventory = useMemo(() => user?.powerUps || [], [user]);
  useEffect(() => {
    const loadHomeMeta = async () => {
      try {
        const [trendingRes, eventsRes, progressionRes] = await Promise.all([
          api.get("/questions/trending/list"),
          api.get("/events/upcoming"),
          api.get("/progression/me"),
        ]);
        setTrendingCategories(trendingRes.data.trending || []);
        setEvents(eventsRes.data.events || []);
        setQuests(progressionRes.data.progression?.daily?.quests || []);
      } catch (metaError) {
        console.error("Failed to load home metadata", metaError);
      }
    };
    loadHomeMeta();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = ({ roomId }) => {
      setMatchmaking(false);
      setIsStartingQuickMatch(false);
      navigate(`/lobby/${roomId}`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1800);
    };

    const handleMatchmakingStarted = () => setMatchmaking(true);
    const handleMatchmakingCancelled = () => {
      setMatchmaking(false);
      setIsStartingQuickMatch(false);
    };

    socket.on("match-found", handleMatchFound);
    socket.on("matchmaking-started", handleMatchmakingStarted);
    socket.on("matchmaking-cancelled", handleMatchmakingCancelled);

    return () => {
      socket.off("match-found", handleMatchFound);
      socket.off("matchmaking-started", handleMatchmakingStarted);
      socket.off("matchmaking-cancelled", handleMatchmakingCancelled);
    };
  }, [socket, navigate]);

  // Add-on: animated confetti for "Start a Battle" call to action
  const [showConfetti, setShowConfetti] = useState(false);

  //— Handlers (unchanged from your backend logic) —//
  const handleCreateRoom = async () => {
    setLoading(true);
    setError();
    try {
      const response = await api.post("/game-rooms/create", {
        category: selectedCategory,
        matchType,
      });
      const roomId = response.data.room.roomId;
      navigate(`/lobby/${roomId}`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1800);
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
    setError();
    try {
      const response = await api.post(`/game-rooms/join/${roomCode.toUpperCase()}`, {});
      const roomId = response.data.room.roomId;
      navigate(`/lobby/${roomId}`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1800);
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
    setIsStartingQuickMatch(true);
    setError();
    socket.emit("find-match", { userId: user.id, category: selectedCategory, matchType });
  };
  const handleCancelMatchmaking = () => {
    if (socket) {
      socket.emit("cancel-matchmaking", { userId: user.id });
    }
    setMatchmaking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDE68A] via-[#FFC700] to-[#F59E00] flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between py-5 px-7 bg-white bg-opacity-75 shadow-lg">
        <motion.h1 layout className="font-bold text-3xl text-[#FFB300] drop-shadow-lg tracking-tight">
          Quiz Battle
        </motion.h1>
        <div className="flex items-center gap-6 flex-wrap justify-end">
          <div className="text-right">
            <span className="font-semibold text-gray-800 block">
              Welcome, <span className="text-[#FFC700]">{user?.username}</span>
            </span>
            <span className="text-xs text-gray-500">
              Tier{" "}
              <span className="font-semibold" style={{ color: userTier.color }}>
                {userTier.name}
              </span>{" "}
              • MMR {Math.round(user?.stats?.rating?.overall ?? 1200)}
            </span>
          </div>
          <div className="hidden sm:flex gap-4 text-sm items-center">
            <span className="badge badge-success">Wins: {user?.stats?.wins ?? 0}</span>
            <span className="badge badge-error">Losses: {user?.stats?.losses ?? 0}</span>
            <span className="badge badge-info capitalize">{matchType}</span>
          </div>
          <button onClick={() => navigate("/profile")} className="btn btn-outline">Profile</button>
          <button onClick={logout} className="btn bg-[#FFB300] hover:bg-[#FFD24C] text-white rounded-lg shadow transition">Logout</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-1 sm:px-8 pb-10">
        {/* Confetti Animation */}
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 pointer-events-none flex justify-center items-center"
            >
              <img src="https://svgur.com/i/15JP.svg" alt="Confetti" className="w-72 h-72 animate-bounce" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-2xl bg-white bg-opacity-90 backdrop-blur rounded-xl shadow-2xl py-8 px-6 md:px-12 mt-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="text-2xl md:text-4xl font-extrabold text-[#FFB300] text-center mb-5"
          >
            Start a Battle
          </motion.h2>

          {error && (
            <motion.div
              layout
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-[#FFF3CD] text-[#92400E] p-3 mb-4 rounded shadow border border-yellow-300 text-center"
            >
              {error}
            </motion.div>
          )}

          <fieldset className="mb-5">
            <label htmlFor="categorySelect" className="block text-base font-semibold mb-1 text-gray-700">Category</label>
            <select
              id="categorySelect"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full py-2.5 px-4 border-2 border-yellow-200 rounded-lg focus:border-[#FFB300] font-medium"
              disabled={matchmaking || loading}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {MATCH_TYPES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setMatchType(mode.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  matchType === mode.id
                    ? "border-[#FFB300] bg-[#FFF0C2] shadow-lg"
                    : "border-yellow-100 bg-white"
                }`}
                disabled={matchmaking || loading || mode.comingSoon}
              >
                <p className="text-xs uppercase text-gray-500 font-semibold">{mode.title}</p>
                <p className="text-lg font-bold text-gray-800 mb-1">{mode.description}</p>
                <span className="text-xs text-gray-500">
                  {mode.comingSoon ? "Coming soon" : `Up to ${mode.maxPlayers} players`}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Match */}
            <motion.div
              initial={{ opacity: 0.7, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, boxShadow: "0 8px 28px -4px #FFB30066" }}
              className="bg-[#FFF6E0] rounded-xl border-2 border-[#FFD24C] shadow-md p-5 flex flex-col items-center transition-all"
            >
              <h3 className="font-bold text-[#FFB300] text-lg mb-1">Quick Match</h3>
              <p className="text-xs text-gray-600 mb-3">Find an opponent instantly</p>
              {matchmaking ? (
                <div className="flex flex-col items-center">
                  <div className="loader border-4 border-yellow-200 border-t-[#FFC700] rounded-full w-10 h-10 animate-spin mb-2"></div>
                  <p className="text-xs text-[#FFB300]">Searching for opponent...</p>
                  <button
                    onClick={handleCancelMatchmaking}
                    className="mt-3 btn bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleFindMatch}
                  className="btn bg-[#FFB300] hover:bg-[#FFF6E0] text-white w-full font-semibold py-2 rounded-lg shadow transition"
                  disabled={loading}
                >
                  {isStartingQuickMatch ? "Pairing..." : "Find Match"}
                </button>
              )}
            </motion.div>

            {/* Create Room */}
            <motion.div
              initial={{ opacity: 0.7, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, boxShadow: "0 8px 28px -4px #FFB30066" }}
              className="bg-[#FFF6E0] rounded-xl border-2 border-[#FFD24C] shadow-md p-5 flex flex-col items-center transition-all"
            >
              <h3 className="font-bold text-[#FFB300] text-lg mb-1">Create Room</h3>
              <p className="text-xs text-gray-600 mb-3">Create a room and share the code</p>
              <button
                onClick={handleCreateRoom}
                className="btn bg-[#FFC700] hover:bg-[#FFD24C] text-white w-full font-semibold py-2 rounded-lg shadow transition"
                disabled={loading || matchmaking}
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
            </motion.div>

            {/* Join Room */}
            <motion.div
              initial={{ opacity: 0.7, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, boxShadow: "0 8px 28px -4px #FFB30066" }}
              className="bg-[#FFF6E0] rounded-xl border-2 border-[#FFD24C] shadow-md p-5 flex flex-col items-center transition-all"
            >
              <h3 className="font-bold text-[#FFB300] text-lg mb-1">Join Room</h3>
              <p className="text-xs text-gray-600 mb-3">Enter a room code to join</p>
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={loading || matchmaking}
                className="w-full py-2 px-4 border-2 border-yellow-200 rounded focus:border-[#FFB300] font-semibold mb-2"
              />
              <button
                onClick={handleJoinRoom}
                className="btn bg-[#FFC700] hover:bg-[#FFD24C] text-white w-full font-semibold py-2 rounded-lg shadow transition"
                disabled={loading || matchmaking}
              >
                {loading ? "Joining..." : "Join Room"}
              </button>
            </motion.div>
          </div>

          {trendingCategories.length > 0 && (
            <div className="mt-8">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Trending Categories</p>
              <div className="flex flex-wrap gap-2">
                {trendingCategories.map((item) => (
                  <span
                    key={item.category}
                    className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold"
                  >
                    {item.category} · {item.score}
                  </span>
                ))}
              </div>
            </div>
          )}

          {quests.length > 0 && (
            <div className="mt-6 bg-[#FFF8E5] border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-gray-800 font-bold">Daily Quests</h4>
                <span className="text-xs text-gray-500">Completing grants boosts</span>
              </div>
              <div className="grid gap-3">
                {quests.map((quest) => {
                  const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
                  return (
                    <div key={quest.id}>
                      <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                        <span>{quest.description}</span>
                        <span>{quest.progress}/{quest.target}</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${quest.completed ? "bg-green-500" : "bg-yellow-400"}`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {events.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-gray-800 font-bold">Live Events</h4>
                <button onClick={() => navigate("/events")} className="text-sm text-[#FFB300] font-semibold">
                  View all
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                  <div key={event._id} className="p-4 border border-yellow-100 rounded-xl bg-white shadow">
                    <p className="text-xs uppercase text-gray-500 font-semibold">{event.type}</p>
                    <p className="text-lg font-bold text-gray-800 mb-1">{event.name}</p>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Starts {new Date(event.startTime).toLocaleString()}</span>
                      <span>{event.participants?.length ?? 0}/{event.maxParticipants}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h4 className="text-gray-800 font-bold mb-2">Power-Up Stash</h4>
            <div className="grid gap-3 md:grid-cols-3">
              {POWER_UPS.map((powerUp) => {
                const owned = powerUpInventory.find((p) => p.type === powerUp.type);
                return (
                  <div
                    key={powerUp.type}
                    className={`rounded-xl p-4 text-white bg-gradient-to-r ${powerUp.color} shadow-lg`}
                  >
                    <p className="text-sm uppercase tracking-wide">{powerUp.label}</p>
                    <p className="text-xs opacity-80 mb-2">{powerUp.description}</p>
                    <p className="text-2xl font-extrabold">{owned?.quantity ?? 0}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extra Links + User Stats */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <button onClick={() => navigate("/profile")} className="btn btn-outline">My Profile</button>
            <button onClick={() => navigate("/leaderboard")} className="btn btn-outline">Leaderboard</button>
            <button onClick={() => navigate("/history")} className="btn btn-outline">Game History</button>
            <button onClick={() => navigate("/events")} className="btn btn-outline">Events</button>
          </div>
        </div>
      </main>

      {/* Example extra features/footer area */}
      <footer className="w-full bg-[#FFF6E0] py-4 mt-auto shadow-inner text-center text-xs font-bold text-[#B28000] tracking-wide">
        Powered by Quiz Battle — Built for speed, fun & competition.
      </footer>
    </div>
  );
}
