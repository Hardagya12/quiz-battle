import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import RetroBackground from "../components/RetroBackground";
import Sidebar from "../components/Sidebar";
import QuestionCard from "../components/QuestionCard";
import { HiLightningBolt, HiClock } from "react-icons/hi";
import { BiHome } from "react-icons/bi";

// Placeholder components for those not yet fully refactored, 
// but we'll style them inline or assume they will be updated soon.
// Ideally, we should refactor these too, but for now let's focus on the page layout.
const Timer = ({ timeRemaining }) => (
  <div className="flex items-center gap-2 font-mono font-bold text-xl text-neo-black bg-neo-white px-4 py-2 border-2 border-neo-black shadow-neo-sm">
    <HiClock className="text-neo-primary" />
    <span>{timeRemaining}s</span>
  </div>
);

const ScoreBoard = ({ scores, player1, player2, currentUserId }) => (
  <div className="flex justify-between items-center bg-neo-white border-3 border-neo-black shadow-neo p-4 mb-6">
    <div className="text-center">
      <p className="font-pixel text-xs mb-1 text-neo-black">{player1?.username || "Player 1"}</p>
      <p className="font-mono font-bold text-2xl text-neo-primary">{scores.player1}</p>
    </div>
    <div className="font-pixel text-neo-black text-sm">VS</div>
    <div className="text-center">
      <p className="font-pixel text-xs mb-1 text-neo-black">{player2?.username || "Player 2"}</p>
      <p className="font-mono font-bold text-2xl text-neo-secondary">{scores.player2}</p>
    </div>
  </div>
);

const PlayerStatus = ({ player1Answered, player2Answered, isPlayer1 }) => (
  <div className="flex justify-between mb-4 px-2">
    <div className={`flex items-center gap-2 ${player1Answered ? "opacity-100" : "opacity-50"}`}>
      <div className={`w-3 h-3 rounded-full border-2 border-neo-black ${player1Answered ? "bg-neo-green" : "bg-gray-300"}`} />
      <span className="font-mono text-xs font-bold">P1 {player1Answered ? "READY" : "THINKING"}</span>
    </div>
    <div className={`flex items-center gap-2 ${player2Answered ? "opacity-100" : "opacity-50"}`}>
      <span className="font-mono text-xs font-bold">P2 {player2Answered ? "READY" : "THINKING"}</span>
      <div className={`w-3 h-3 rounded-full border-2 border-neo-black ${player2Answered ? "bg-neo-green" : "bg-gray-300"}`} />
    </div>
  </div>
);

const GameRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [gameState, setGameState] = useState({
    question: null,
    questionIndex: 0,
    totalQuestions: 10,
    timeRemaining: 20,
    scores: { player1: 0, player2: 0 },
    player1Answered: false,
    player2Answered: false,
    room: null,
  });
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [availablePowerUps, setAvailablePowerUps] = useState(() => user?.powerUps || []);

  useEffect(() => {
    setAvailablePowerUps(user?.powerUps || []);
  }, [user]);

  useEffect(() => {
    if (!countdown) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((countdown.expiresAt - Date.now()) / 1000));
      setCountdownSeconds(remaining);
      if (remaining <= 0) {
        setCountdown(null);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    if (!countdown) {
      setCountdownSeconds(0);
    }
  }, [countdown]);

  useEffect(() => {
    if (!socket || !user) return;

    console.log("GameRoom: Setting up socket listeners", { roomId, userId: user.id });

    // Join room
    socket.emit("join-room", { roomId, userId: user.id });

    // Game started
    socket.on("game-started", ({ question, room, startDelayMs }) => {
      console.log("GameRoom: Game started event received", { question, room });
      setGameState((prev) => ({
        ...prev,
        question,
        questionIndex: question.questionIndex,
        totalQuestions: question.totalQuestions,
        timeRemaining: question.timeLimit,
        room,
      }));
      if (startDelayMs) {
        setCountdown({
          duration: startDelayMs,
          expiresAt: Date.now() + startDelayMs,
          message: "Match starting...",
        });
      }
    });

    socket.on("game-countdown", ({ duration, message }) => {
      setCountdown({
        duration,
        expiresAt: Date.now() + duration,
        message,
      });
    });

    // Timer update
    socket.on("timer-update", ({ timeRemaining }) => {
      setCountdown(null);
      setGameState((prev) => ({
        ...prev,
        timeRemaining,
      }));
    });

    // Question timeout
    socket.on("question-timeout", ({ currentScores }) => {
      setGameState((prev) => ({
        ...prev,
        scores: currentScores,
        player1Answered: true,
        player2Answered: true,
      }));
      setHasAnswered(true);
      setSelectedAnswer(null);
    });

    // Answer received
    socket.on("answer-received", ({ isPlayer1, isCorrect, points, currentScores }) => {
      const isCurrentPlayer = (isPlayer1 && gameState.room?.player1?.toString() === user.id) ||
        (!isPlayer1 && gameState.room?.player2?.toString() === user.id);

      if (isCurrentPlayer) {
        setHasAnswered(true);
      }

      setGameState((prev) => ({
        ...prev,
        scores: currentScores,
        player1Answered: isPlayer1 ? true : prev.player1Answered,
        player2Answered: !isPlayer1 ? true : prev.player2Answered,
      }));
    });

    // Next question
    socket.on("next-question", ({ question, currentScores }) => {
      setGameState((prev) => ({
        ...prev,
        question,
        questionIndex: question.questionIndex,
        timeRemaining: question.timeLimit,
        scores: currentScores,
        player1Answered: false,
        player2Answered: false,
      }));
      setHasAnswered(false);
      setSelectedAnswer(null);
    });

    // Game ended
    socket.on("game-ended", ({ winner, scores, gameHistory }) => {
      navigate(`/result/${roomId}`, {
        state: { winner, scores, gameHistory },
      });
    });

    socket.on("powerup-used", ({ userId: actorId, type }) => {
      if (actorId !== user.id) return;
      setAvailablePowerUps((prev) =>
        prev.map((entry) =>
          entry.type === type ? { ...entry, quantity: Math.max(0, entry.quantity - 1) } : entry
        )
      );
    });

    socket.on("error", ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off("game-started");
      socket.off("timer-update");
      socket.off("question-timeout");
      socket.off("answer-received");
      socket.off("next-question");
      socket.off("game-ended");
      socket.off("game-countdown");
      socket.off("powerup-used");
      socket.off("error");
    };
  }, [socket, roomId, user.id, navigate]);

  const handleAnswer = (answer) => {
    if (hasAnswered || !socket || !gameState.question) return;

    setSelectedAnswer(answer);
    const timeRemaining = gameState.timeRemaining;

    socket.emit("answer-question", {
      roomId,
      userId: user.id,
      answer,
      timeRemaining,
    });
  };

  const handleUsePowerUp = (type) => {
    const inventoryItem = availablePowerUps.find((p) => p.type === type);
    if (!inventoryItem || inventoryItem.quantity <= 0) {
      setError("You have no charges left for that power-up.");
      return;
    }
    if (!socket) return;
    socket.emit("use-powerup", {
      roomId,
      userId: user.id,
      type,
    });
  };

  const isPlayer1 = gameState.room?.player1?.toString() === user.id || 
    gameState.room?.player1?._id?.toString() === user.id;
  const matchType = gameState.room?.matchType || "duel";

  if (error && !gameState.question) {
    return (
      <div className="min-h-screen p-4 relative overflow-hidden flex items-center justify-center">
        <RetroBackground />
        <Sidebar />
        <div className="bg-neo-white p-8 border-3 border-neo-black shadow-neo-xl max-w-md w-full text-center relative z-10">
          <div className="font-mono text-red-500 font-bold mb-4">{error}</div>
          <button onClick={() => navigate("/")} className="btn btn-primary flex items-center gap-2 mx-auto">
            <BiHome className="text-xl" />
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  if (!gameState.question) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <RetroBackground />
        <Sidebar />
        <div className="relative z-10 text-neo-black font-pixel text-2xl animate-pulse">
          WAITING FOR GAME TO START...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <RetroBackground />
      <Sidebar />
      
      <div className="max-w-4xl mx-auto relative z-10 pt-4">
        {/* Header */}
        <header className="bg-neo-white p-4 border-3 border-neo-black shadow-neo mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold font-pixel text-neo-black mb-1">
              QUESTION {gameState.questionIndex + 1} / {gameState.totalQuestions}
            </h2>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-neo-accent border-2 border-neo-black text-xs font-bold uppercase">
                {gameState.question.category}
              </span>
              <span className="px-2 py-0.5 bg-neo-purple border-2 border-neo-black text-xs font-bold uppercase">
                {matchType}
              </span>
            </div>
          </div>
          <Timer timeRemaining={gameState.timeRemaining} />
        </header>

        {countdown && (
          <div className="bg-neo-black text-neo-white border-3 border-neo-white shadow-neo-lg p-6 mb-6 text-center animate-bounce">
            <p className="font-pixel text-lg text-neo-accent mb-2">{countdown.message || "GET READY"}</p>
            <div className="text-5xl font-bold font-mono">{countdownSeconds}</div>
          </div>
        )}

        <ScoreBoard
          scores={gameState.scores}
          player1={gameState.room?.player1}
          player2={gameState.room?.player2}
          currentUserId={user.id}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-3">
            <PlayerStatus
              player1Answered={gameState.player1Answered}
              player2Answered={gameState.player2Answered}
              isPlayer1={isPlayer1}
            />

            <QuestionCard
              question={gameState.question.question}
              options={gameState.question.options}
              selectedAnswer={selectedAnswer}
              hasAnswered={hasAnswered}
              onAnswer={handleAnswer}
            />
          </div>

          {/* Power Ups Sidebar */}
          <aside className="bg-neo-white border-3 border-neo-black shadow-neo p-4 h-fit">
            <p className="font-pixel text-xs text-neo-black mb-4 flex items-center gap-2">
              <HiLightningBolt className="text-neo-accent" />
              POWER-UPS
            </p>
            <div className="flex flex-col gap-3">
              {/* We need to import POWER_UPS constant or define it. 
                  Assuming it's available or we map availablePowerUps directly if it has labels.
                  Since we don't have the constant imported in this snippet, let's rely on availablePowerUps 
                  but usually we want the full list to show disabled ones too.
                  For now, let's just map availablePowerUps if they have metadata, 
                  or better, let's import the constant if we can. 
                  Actually, let's just use availablePowerUps for now to be safe.
              */}
              {availablePowerUps.map((powerUp) => (
                <button
                  key={powerUp.type}
                  onClick={() => handleUsePowerUp(powerUp.type)}
                  disabled={hasAnswered || powerUp.quantity <= 0 || countdown}
                  className={`w-full px-3 py-2 border-2 border-neo-black font-bold text-xs uppercase transition-all ${
                    powerUp.quantity > 0
                      ? "bg-neo-bg hover:bg-neo-accent hover:-translate-y-0.5 shadow-neo-sm"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{powerUp.type}</span>
                    <span className="bg-neo-black text-neo-white px-1.5 py-0.5 text-[10px]">
                      x{powerUp.quantity}
                    </span>
                  </div>
                </button>
              ))}
              {availablePowerUps.length === 0 && (
                <p className="text-xs font-mono text-gray-500 text-center">No power-ups available</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
