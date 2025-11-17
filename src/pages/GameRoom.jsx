import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import QuestionCard from "../components/QuestionCard";
import ScoreBoard from "../components/ScoreBoard";
import Timer from "../components/Timer";
import PlayerStatus from "../components/PlayerStatus";

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

  useEffect(() => {
    if (!socket || !user) return;

    console.log("GameRoom: Setting up socket listeners", { roomId, userId: user.id });

    // Join room
    socket.emit("join-room", { roomId, userId: user.id });

    // Game started
    socket.on("game-started", ({ question, room }) => {
      console.log("GameRoom: Game started event received", { question, room });
      setGameState((prev) => ({
        ...prev,
        question,
        questionIndex: question.questionIndex,
        totalQuestions: question.totalQuestions,
        timeRemaining: question.timeLimit,
        room,
      }));
    });

    // Timer update
    socket.on("timer-update", ({ timeRemaining }) => {
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

  const isPlayer1 = gameState.room?.player1?.toString() === user.id || 
    gameState.room?.player1?._id?.toString() === user.id;

  if (error && !gameState.question) {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-2xl text-center">
          <div className="error-message mb-4">{error}</div>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!gameState.question) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
        <div className="loading">Waiting for game to start...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-xl mb-4 flex justify-between items-center shadow-lg flex-col md:flex-row gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Question {gameState.questionIndex + 1} of {gameState.totalQuestions}</h2>
            <span className="inline-block px-3 py-1 bg-indigo-500 text-white rounded-full text-xs font-semibold">
              {gameState.question.category}
            </span>
          </div>
          <Timer timeRemaining={gameState.timeRemaining} />
        </div>

        <ScoreBoard
          scores={gameState.scores}
          player1={gameState.room?.player1}
          player2={gameState.room?.player2}
          currentUserId={user.id}
        />

        <div>
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
      </div>
    </div>
  );
};

export default GameRoom;

