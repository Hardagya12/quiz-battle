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

  const { winner, scores, gameHistory } = result;
  const isWinner = winner && (winner.toString() === user.id || winner._id?.toString() === user.id);
  const player1Score = scores?.player1 || gameHistory?.players?.[0]?.score || 0;
  const player2Score = scores?.player2 || gameHistory?.players?.[1]?.score || 0;
  const userScore = scores?.player1?.toString() === user.id ? player1Score : player2Score;
  const opponentScore = scores?.player1?.toString() === user.id ? player2Score : player1Score;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl text-center">
        <div className={`p-8 rounded-xl mb-8 ${
          isWinner 
            ? "bg-gradient-to-br from-green-500 to-green-600 text-white" 
            : winner 
            ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
            : "bg-gradient-to-br from-gray-500 to-gray-600 text-white"
        }`}>
          {isWinner ? (
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

        {gameHistory && (
          <div className="bg-gray-50 p-6 rounded-xl mb-8 text-left">
            <h3 className="mb-4 text-xl font-semibold text-gray-800">Game Details</h3>
            <div className="space-y-2 text-gray-600">
              <p><strong>Duration:</strong> {gameHistory.duration}s</p>
              <p><strong>Category:</strong> {gameHistory.category}</p>
              <p><strong>Questions:</strong> {gameHistory.questions?.length || 10}</p>
            </div>
          </div>
        )}

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

