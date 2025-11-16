import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import "./GameResult.css";

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
      <div className="result-container">
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-container">
        <div className="error-message">Result not found</div>
        <button onClick={() => navigate("/")} className="btn btn-primary">
          Go Home
        </button>
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
    <div className="result-container">
      <div className="result-card">
        <div className={`result-header ${isWinner ? "winner" : "loser"}`}>
          {isWinner ? (
            <>
              <h1>🎉 You Won! 🎉</h1>
              <p>Congratulations on your victory!</p>
            </>
          ) : winner ? (
            <>
              <h1>😔 You Lost</h1>
              <p>Better luck next time!</p>
            </>
          ) : (
            <>
              <h1>🤝 It's a Tie!</h1>
              <p>Great game!</p>
            </>
          )}
        </div>

        <div className="score-summary">
          <div className="score-item">
            <h3>Your Score</h3>
            <p className="score-value">{userScore}</p>
          </div>
          <div className="vs-divider">VS</div>
          <div className="score-item">
            <h3>Opponent Score</h3>
            <p className="score-value">{opponentScore}</p>
          </div>
        </div>

        {gameHistory && (
          <div className="game-details">
            <h3>Game Details</h3>
            <p>
              <strong>Duration:</strong> {gameHistory.duration}s
            </p>
            <p>
              <strong>Category:</strong> {gameHistory.category}
            </p>
            <p>
              <strong>Questions:</strong> {gameHistory.questions?.length || 10}
            </p>
          </div>
        )}

        <div className="result-actions">
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

