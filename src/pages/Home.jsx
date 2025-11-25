import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";
import { CATEGORIES, MATCH_TYPES, POWER_UPS, TIERS } from "../utils/constants";
import { motion, AnimatePresence } from "framer-motion";
import RetroBackground from "../components/RetroBackground";
import Sidebar from "../components/Sidebar";
import { IoLogOutOutline } from "react-icons/io5";
import { HiSparkles, HiBolt, HiKey, HiFire } from "react-icons/hi2";
import { BiLoaderAlt, BiTargetLock } from "react-icons/bi";
import { MdEventAvailable } from "react-icons/md";

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
  const [showConfetti, setShowConfetti] = useState(false);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <RetroBackground />
      <Sidebar />

      {/* Header */}
      <header className="relative z-50 bg-neo-white border-b-3 border-neo-black shadow-neo">
        <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <motion.h1
            className="font-pixel text-2xl md:text-3xl text-neo-black"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            QUIZ BATTLE
          </motion.h1>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="font-bold font-mono text-neo-black text-sm mb-1 uppercase">
                {user?.username}
              </p>
              <div className="flex items-center gap-2 justify-end">
                <span className="px-2 py-0.5 border-2 border-neo-black text-xs font-bold bg-neo-accent text-neo-black">
                  {userTier.name}
                </span>
                <span className="text-xs font-mono font-bold text-neo-black">
                  {Math.round(user?.stats?.rating?.overall ?? 1200)} MMR
                </span>
              </div>
            </div>
            <button onClick={logout} className="btn btn-outline px-4 py-2 text-sm flex items-center gap-2 border-2 border-neo-black hover:bg-neo-black hover:text-neo-white">
              <IoLogOutOutline className="text-lg" />
              LOGOUT
            </button>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            >
              <div className="text-6xl animate-bounce">🎉</div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column: Game Modes */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Play Section */}
            <motion.section variants={itemVariants} className="bg-neo-white border-3 border-neo-black shadow-neo-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <HiBolt className="text-9xl text-neo-black" />
              </div>
              
              <h2 className="text-2xl font-pixel text-neo-black mb-6 flex items-center gap-3">
                <HiBolt className="text-neo-primary" />
                QUICK PLAY
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="font-mono font-bold uppercase text-sm">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="neo-input"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="font-mono font-bold uppercase text-sm">Mode</label>
                    <div className="flex gap-2">
                      {MATCH_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setMatchType(type.id)}
                          className={`flex-1 py-2 border-3 border-neo-black font-bold text-sm uppercase transition-all ${
                            matchType === type.id
                              ? "bg-neo-black text-neo-white"
                              : "bg-neo-white text-neo-black hover:bg-gray-100"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-end space-y-3">
                  {matchmaking ? (
                    <div className="text-center p-4 bg-neo-bg border-3 border-neo-black animate-pulse">
                      <p className="font-pixel text-sm mb-2">SEARCHING...</p>
                      <button 
                        onClick={handleCancelMatchmaking}
                        className="text-red-500 font-bold hover:underline text-sm"
                      >
                        CANCEL
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleFindMatch}
                        disabled={loading}
                        className="btn btn-primary w-full py-4 text-lg shadow-neo hover:shadow-neo-lg hover:-translate-y-1"
                      >
                        FIND MATCH
                      </button>
                      <button
                        onClick={handleCreateRoom}
                        disabled={loading}
                        className="btn btn-secondary w-full"
                      >
                        CREATE ROOM
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Join Room Section */}
            <motion.section variants={itemVariants} className="bg-neo-white border-3 border-neo-black shadow-neo p-6">
              <h2 className="text-xl font-pixel text-neo-black mb-4 flex items-center gap-3">
                <HiKey className="text-neo-secondary" />
                JOIN ROOM
              </h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="ENTER CODE"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="neo-input flex-1 uppercase tracking-widest"
                  maxLength={6}
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={loading || !roomCode}
                  className="btn btn-accent"
                >
                  JOIN
                </button>
              </div>
              {error && <p className="mt-2 text-red-500 font-bold text-sm">{error}</p>}
            </motion.section>
          </div>

          {/* Right Column: Stats & Events */}
          <div className="space-y-8">
            {/* Daily Quests */}
            <motion.section variants={itemVariants} className="bg-neo-white border-3 border-neo-black shadow-neo p-6">
              <h3 className="font-pixel text-lg mb-4 flex items-center gap-2">
                <BiTargetLock className="text-neo-accent" />
                DAILY QUESTS
              </h3>
              <div className="space-y-4">
                {quests.length > 0 ? (
                  quests.map((quest, i) => (
                    <div key={i} className="border-2 border-neo-black p-3 bg-neo-bg">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-sm">{quest.description}</span>
                        <span className="text-xs font-mono">{quest.progress}/{quest.target}</span>
                      </div>
                      <div className="w-full bg-white border border-neo-black h-2">
                        <div 
                          className="bg-neo-green h-full" 
                          style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 font-mono">No active quests.</p>
                )}
              </div>
            </motion.section>

            {/* Trending */}
            <motion.section variants={itemVariants} className="bg-neo-white border-3 border-neo-black shadow-neo p-6">
              <h3 className="font-pixel text-lg mb-4 flex items-center gap-2">
                <HiFire className="text-orange-500" />
                TRENDING
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingCategories.map((cat, i) => (
                  <span key={i} className="px-3 py-1 bg-neo-bg border-2 border-neo-black text-xs font-bold uppercase hover:bg-neo-accent cursor-pointer transition-colors">
                    #{cat}
                  </span>
                ))}
              </div>
            </motion.section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
