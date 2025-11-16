import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import QuestionCard from "../components/QuestionCard";
import ScoreBoard from "../components/ScoreBoard";
import Timer from "../components/Timer";
import PlayerStatus from "../components/PlayerStatus";
import "./GameRoom.css";

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
      <div className="game-room-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate("/")} className="btn btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  if (!gameState.question) {
    return (
      <div className="game-room-container">
        <div className="loading">Waiting for game to start...</div>
      </div>
    );
  }

  return (
    <div className="game-room-container">
      <div className="game-header">
        <div className="game-info">
          <h2>Question {gameState.questionIndex + 1} of {gameState.totalQuestions}</h2>
          <p className="category-badge">{gameState.question.category}</p>
        </div>
        <Timer timeRemaining={gameState.timeRemaining} />
      </div>

      <ScoreBoard
        scores={gameState.scores}
        player1={gameState.room?.player1}
        player2={gameState.room?.player2}
        currentUserId={user.id}
      />

      <div className="game-content">
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
  );
};

export default GameRoom;

