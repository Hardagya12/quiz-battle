import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

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
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <div className="error-message mb-4">Result not found</div>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Go Home
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
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl text-center">
        <div
          className={`p-8 rounded-xl mb-8 ${
            isWinner || raidSuccess
              ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
              : winner
              ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
              : "bg-gradient-to-br from-gray-500 to-gray-600 text-white"
          }`}
        >
          {matchType === "raid" ? (
            raidSuccess ? (
              <>
                <h1 className="text-4xl font-bold mb-2">🛡️ Raid Cleared!</h1>
                <p className="text-xl">The Quiz Titan has been defeated.</p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold mb-2">💥 Raid Failed</h1>
                <p className="text-xl">The boss survived. Regroup and try again!</p>
              </>
            )
          ) : isWinner ? (
            <>
              <h1 className="text-4xl font-bold mb-2">🎉 You Won! 🎉</h1>
              <p className="text-xl">Congratulations on your victory!</p>
            </>
          ) : winner ? (
            <>
              <h1 className="text-4xl font-bold mb-2">😔 You Lost</h1>
              <p className="text-xl">Better luck next time!</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-2">🤝 It's a Tie!</h1>
              <p className="text-xl">Great game!</p>
            </>
          )}
        </div>

        {matchType === "raid" ? (
          <div className="flex flex-col md:flex-row items-center justify-around mb-8 p-6 bg-gray-50 rounded-xl gap-4">
            <div className="text-center">
              <h3 className="mb-2 text-sm text-gray-600 uppercase font-semibold">Team Damage</h3>
              <p className="text-4xl font-bold text-indigo-500">{raidDamage}</p>
            </div>
            <div className="text-2xl font-bold text-gray-500 px-4">vs</div>
            <div className="text-center">
              <h3 className="mb-2 text-sm text-gray-600 uppercase font-semibold">Boss HP</h3>
              <p className="text-4xl font-bold text-red-500">{raidBossHp}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-around mb-8 p-6 bg-gray-50 rounded-xl">
            <div className="text-center">
              <h3 className="mb-2 text-sm text-gray-600 uppercase font-semibold">Your Score</h3>
              <p className="text-4xl font-bold text-indigo-500">{userScore}</p>
            </div>
            <div className="text-2xl font-bold text-gray-500 px-4">VS</div>
            <div className="text-center">
              <h3 className="mb-2 text-sm text-gray-600 uppercase font-semibold">Opponent Score</h3>
              <p className="text-4xl font-bold text-indigo-500">{opponentScore}</p>
            </div>
          </div>
        )}

        {gameHistory && (
          <div className="bg-gray-50 p-6 rounded-xl mb-8 text-left">
            <h3 className="mb-4 text-xl font-semibold text-gray-800">Game Details</h3>
            <div className="space-y-2 text-gray-600">
              <p><strong>Duration:</strong> {gameHistory.duration}s</p>
              <p><strong>Category:</strong> {gameHistory.category}</p>
              <p><strong>Questions:</strong> {gameHistory.questions?.length || 10}</p>
              {gameHistory.highlights && (
                <p><strong>Margin:</strong> {gameHistory.highlights.margin} pts</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={handleCopyShare} className="btn btn-sm btn-outline">
                {shareCopied ? "Copied!" : "Share Highlight"}
              </button>
              <button onClick={() => navigate(`/lobby/${roomId}`)} className="btn btn-sm btn-primary">
                Rematch Lobby
              </button>
            </div>
          </div>
        )}

        {gameHistory?.questions && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-8 text-left max-h-80 overflow-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Question Breakdown</h3>
            <div className="space-y-3">
              {gameHistory.questions.map((question, index) => (
                <div key={question._id || index} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Question {index + 1}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded bg-indigo-50">
                      <p className="text-xs uppercase text-gray-500">Player 1</p>
                      <p className="font-semibold text-gray-800">{question.player1Answer.points} pts</p>
                      <p className="text-xs text-gray-500">
                        {question.player1Answer.usedPowerup ? `Power-up: ${question.player1Answer.usedPowerup}` : "No power-up"}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-yellow-50">
                      <p className="text-xs uppercase text-gray-500">Player 2</p>
                      <p className="font-semibold text-gray-800">{question.player2Answer.points} pts</p>
                      <p className="text-xs text-gray-500">
                        {question.player2Answer.usedPowerup ? `Power-up: ${question.player2Answer.usedPowerup}` : "No power-up"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Drop a Reaction</h3>
          <div className="flex gap-3 justify-center">
            {["🔥", "😂", "👏", "🤯"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => setReaction(emoji)}
                className={`text-3xl transition-transform ${reaction === emoji ? "scale-110" : "opacity-70 hover:opacity-100"}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {reaction && <p className="text-sm text-gray-500 mt-3">Thanks! Reaction saved locally.</p>}
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Play Again
          </button>
          <button onClick={() => navigate("/history")} className="btn btn-outline">
            View History
          </button>
          <button onClick={() => navigate("/leaderboard")} className="btn btn-outline">
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResult;

