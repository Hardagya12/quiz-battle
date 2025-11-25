import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import RetroBackground from "../components/RetroBackground";
import Sidebar from "../components/Sidebar";
import { HiShare, HiHome, HiRefresh } from "react-icons/hi";

const GameResult = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [result, setResult] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [reaction, setReaction] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!location.state) {
      // Fetch result if not passed via state
      const fetchResult = async () => {
        try {
          const response = await api.get(`/game-rooms/${roomId}`);
          // In a real app, you'd fetch game history here
          setResult(response.data);
        } catch (error) {
          console.error("Failed to fetch result:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
    }
  }, [roomId, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
        <RetroBackground />
        <Sidebar />
        <div className="relative z-10 text-neo-black font-pixel text-2xl animate-pulse">LOADING RESULTS...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
        <RetroBackground />
        <Sidebar />
        <div className="bg-neo-white p-8 border-3 border-neo-black shadow-neo-xl max-w-md w-full text-center relative z-10">
          <div className="text-neo-primary font-bold font-mono mb-4">RESULT NOT FOUND</div>
          <button onClick={() => navigate("/")} className="btn btn-primary w-full">
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  const { winner, scores, gameHistory, matchType: resultMatchType, raidMeta } = result;
  const matchType = resultMatchType || gameHistory?.matchType || "duel";
  const raidSuccess = matchType === "raid" && (raidMeta?.success ?? gameHistory?.raidMeta?.success);
  const isWinner =
    raidSuccess ||
    !!(winner && (winner.toString() === user.id || winner._id?.toString() === user.id));
  const player1Score = scores?.player1 ?? gameHistory?.players?.[0]?.score ?? 0;
  const player2Score = scores?.player2 ?? gameHistory?.players?.[1]?.score ?? 0;
  const userIsPlayer1 =
    gameHistory?.players?.[0]?.user?._id?.toString() === user.id ||
    gameHistory?.players?.[0]?.user?.toString() === user.id;
  const userScore = userIsPlayer1 ? player1Score : player2Score;
  const opponentScore = userIsPlayer1 ? player2Score : player1Score;

  const shareUrl = gameHistory?.shareLink
    ? `${window.location.origin}${gameHistory.shareLink}`
    : window.location.href;
  const raidBossHp = raidMeta?.bossHp ?? gameHistory?.raidMeta?.bossHp ?? 1000;
  const raidDamage = (scores?.player1 ?? 0) + (scores?.player2 ?? 0);

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy share link", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      <RetroBackground />
      <Sidebar />
      
      <div className="bg-neo-white border-3 border-neo-black shadow-neo-xl p-8 max-w-3xl w-full relative z-10 text-center">
        <div
          className={`p-8 border-3 border-neo-black shadow-neo mb-8 ${
            isWinner || raidSuccess
              ? "bg-neo-green text-neo-black"
              : winner
              ? "bg-neo-primary text-white"
              : "bg-gray-200 text-neo-black"
          }`}
        >
          {matchType === "raid" ? (
            raidSuccess ? (
              <>
                <h1 className="text-4xl font-bold font-pixel mb-2">🛡️ RAID CLEARED!</h1>
                <p className="text-xl font-mono font-bold uppercase">The Quiz Titan has been defeated.</p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold font-pixel mb-2">💥 RAID FAILED</h1>
                <p className="text-xl font-mono font-bold uppercase">The boss survived. Regroup and try again!</p>
              </>
            )
          ) : isWinner ? (
            <>
              <h1 className="text-4xl font-bold font-pixel mb-2">🎉 VICTORY! 🎉</h1>
              <p className="text-xl font-mono font-bold uppercase">Congratulations on your win!</p>
            </>
          ) : winner ? (
            <>
              <h1 className="text-4xl font-bold font-pixel mb-2">😔 DEFEAT</h1>
              <p className="text-xl font-mono font-bold uppercase">Better luck next time!</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold font-pixel mb-2">🤝 DRAW!</h1>
              <p className="text-xl font-mono font-bold uppercase">It's a tie game!</p>
            </>
          )}
        </div>

        {matchType === "raid" ? (
          <div className="flex flex-col md:flex-row items-center justify-around mb-8 p-6 bg-neo-bg border-3 border-neo-black shadow-neo gap-4">
            <div className="text-center">
              <h3 className="mb-2 text-xs font-bold font-mono text-gray-600 uppercase">Team Damage</h3>
              <p className="text-4xl font-bold font-pixel text-neo-primary">{raidDamage}</p>
            </div>
            <div className="text-2xl font-bold font-pixel text-neo-black px-4">VS</div>
            <div className="text-center">
              <h3 className="mb-2 text-xs font-bold font-mono text-gray-600 uppercase">Boss HP</h3>
              <p className="text-4xl font-bold font-pixel text-neo-primary">{raidBossHp}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-around mb-8 p-6 bg-neo-bg border-3 border-neo-black shadow-neo">
            <div className="text-center">
              <h3 className="mb-2 text-xs font-bold font-mono text-gray-600 uppercase">Your Score</h3>
              <p className="text-4xl font-bold font-pixel text-neo-primary">{userScore}</p>
            </div>
            <div className="text-2xl font-bold font-pixel text-neo-black px-4">VS</div>
            <div className="text-center">
              <h3 className="mb-2 text-xs font-bold font-mono text-gray-600 uppercase">Opponent</h3>
              <p className="text-4xl font-bold font-pixel text-gray-600">{opponentScore}</p>
            </div>
          </div>
        )}

        {gameHistory && (
          <div className="bg-neo-white p-6 border-3 border-neo-black shadow-neo mb-8 text-left">
            <h3 className="mb-4 text-xl font-bold font-pixel text-neo-black">GAME DETAILS</h3>
            <div className="space-y-2 text-neo-black font-mono text-sm">
              <p><strong>DURATION:</strong> {gameHistory.duration}s</p>
              <p><strong>CATEGORY:</strong> {gameHistory.category}</p>
              <p><strong>QUESTIONS:</strong> {gameHistory.questions?.length || 10}</p>
              {gameHistory.highlights && (
                <p><strong>MARGIN:</strong> {gameHistory.highlights.margin} pts</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={handleCopyShare} className="btn btn-outline border-2 border-neo-black text-xs px-3 py-2 flex items-center gap-2 hover:bg-neo-black hover:text-neo-white">
                <HiShare /> {shareCopied ? "COPIED!" : "SHARE HIGHLIGHT"}
              </button>
              <button onClick={() => navigate(`/lobby/${roomId}`)} className="btn btn-primary text-xs px-3 py-2 flex items-center gap-2 shadow-neo-sm hover:translate-y-1 hover:shadow-none">
                <HiRefresh /> REMATCH LOBBY
              </button>
            </div>
          </div>
        )}

        <div className="bg-neo-white border-3 border-neo-black shadow-neo p-6 mb-8">
          <h3 className="text-xl font-bold font-pixel text-neo-black mb-4">REACT</h3>
          <div className="flex gap-4 justify-center">
            {["🔥", "😂", "👏", "🤯"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => setReaction(emoji)}
                className={`text-4xl transition-transform hover:scale-125 ${reaction === emoji ? "scale-125 drop-shadow-md" : "opacity-80 hover:opacity-100"}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {reaction && <p className="text-xs font-bold font-mono text-neo-primary mt-3 uppercase">Reaction saved!</p>}
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => navigate("/")} className="btn btn-primary px-6 py-3 text-lg shadow-neo hover:shadow-neo-lg hover:-translate-y-1">
            PLAY AGAIN
          </button>
          <button onClick={() => navigate("/history")} className="btn btn-outline border-2 border-neo-black px-6 py-3 hover:bg-neo-black hover:text-neo-white">
            HISTORY
          </button>
          <button onClick={() => navigate("/leaderboard")} className="btn btn-outline border-2 border-neo-black px-6 py-3 hover:bg-neo-black hover:text-neo-white">
            LEADERBOARD
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResult;
