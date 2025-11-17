import GameRoom from "../models/GameRoom.js";
import GameHistory from "../models/GameHistory.js";
import Question from "../models/Question.js";
import User from "../models/User.js";

const QUESTION_TIME_LIMIT = 20; // seconds
const QUESTIONS_PER_GAME = 10;

// Calculate score based on time and correctness
const calculateScore = (isCorrect, timeRemaining, basePoints = 100) => {
  if (!isCorrect) return 0;
  const timeBonus = (timeRemaining / QUESTION_TIME_LIMIT) * 50;
  return Math.round(basePoints + timeBonus);
};

export const handleGameEvents = (io, socket, activeRooms) => {
  // Start game
  socket.on("start-game", async ({ roomId, userId }) => {
    try {
      const gameRoom = await GameRoom.findOne({ roomId })
        .populate("player1", "username")
        .populate("player2", "username");

      if (!gameRoom) {
        return socket.emit("error", { message: "Room not found" });
      }

      // Check if user is authorized and both players are present
      const player1Id = gameRoom.player1._id?.toString() || gameRoom.player1.toString();
      const player2Id = gameRoom.player2?._id?.toString() || gameRoom.player2?.toString();
      const isPlayer1 = player1Id === userId;
      const isPlayer2 = gameRoom.player2 && player2Id === userId;

      if (!isPlayer1 && !isPlayer2) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      if (!gameRoom.player2) {
        return socket.emit("error", { message: "Waiting for opponent" });
      }

      if (gameRoom.status !== "waiting") {
        return socket.emit("error", { message: "Game already started or finished" });
      }

      // Get random questions
      const questions = await Question.aggregate([
        ...(gameRoom.category !== "General"
          ? [{ $match: { category: gameRoom.category } }]
          : []),
        { $sample: { size: QUESTIONS_PER_GAME } },
      ]);

      if (questions.length < QUESTIONS_PER_GAME) {
        console.error(`Not enough questions: found ${questions.length}, needed ${QUESTIONS_PER_GAME}`);
        return socket.emit("error", {
          message: `Not enough questions available (found ${questions.length}, need ${QUESTIONS_PER_GAME}). Please run the seed script or select a different category.`,
        });
      }

      // Initialize game room
      gameRoom.questions = questions.map((q) => ({
        question: q._id,
        player1Answer: null,
        player2Answer: null,
      }));
      gameRoom.status = "active";
      gameRoom.currentQuestionIndex = 0;
      gameRoom.scores = { player1: 0, player2: 0 };
      gameRoom.startedAt = new Date();
      gameRoom.questionTimeLimit = QUESTION_TIME_LIMIT;

      await gameRoom.save();

      // Store in memory
      const roomData = activeRooms.get(roomId) || {};
      roomData.gameRoom = gameRoom;
      roomData.currentQuestionIndex = 0;
      if (!roomData.timers) {
        roomData.timers = {};
      }
      activeRooms.set(roomId, roomData);

      // Send first question to both players
      const currentQuestion = questions[0];
      const questionData = {
        question: currentQuestion.question,
        options: currentQuestion.options,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        questionIndex: 0,
        totalQuestions: QUESTIONS_PER_GAME,
        timeLimit: QUESTION_TIME_LIMIT,
      };

      console.log(`Emitting game-started to room ${roomId}`, {
        questionCount: questions.length,
        roomId,
        players: [player1Id, player2Id],
      });

      io.to(roomId).emit("game-started", {
        room: gameRoom,
        question: questionData,
      });

      // Start timer for first question
      startQuestionTimer(io, roomId, 0, questions, gameRoom, activeRooms);
    } catch (error) {
      socket.emit("error", { message: "Failed to start game", error: error.message });
    }
  });

  // Answer question
  socket.on("answer-question", async ({ roomId, userId, answer, timeRemaining }) => {
    try {
      const gameRoom = await GameRoom.findOne({ roomId });
      if (!gameRoom || gameRoom.status !== "active") {
        return socket.emit("error", { message: "Game not active" });
      }

      const isPlayer1 = gameRoom.player1.toString() === userId;
      const isPlayer2 = gameRoom.player2 && gameRoom.player2.toString() === userId;

      if (!isPlayer1 && !isPlayer2) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      const currentIndex = gameRoom.currentQuestionIndex;
      const currentQuestionData = gameRoom.questions[currentIndex];

      if (!currentQuestionData) {
        return socket.emit("error", { message: "Invalid question index" });
      }

      // Check if already answered
      const answerKey = isPlayer1 ? "player1Answer" : "player2Answer";
      if (currentQuestionData[answerKey] && currentQuestionData[answerKey].answer) {
        return socket.emit("error", { message: "Already answered this question" });
      }

      // Get question to check answer
      const question = await Question.findById(currentQuestionData.question);
      if (!question) {
        return socket.emit("error", { message: "Question not found" });
      }

      const isCorrect = question.correctAnswer === answer;
      const points = calculateScore(isCorrect, timeRemaining, question.points);

      // Update answer
      currentQuestionData[answerKey] = {
        answer,
        answeredAt: new Date(),
        points,
      };

      // Update score
      if (isPlayer1) {
        gameRoom.scores.player1 += points;
      } else {
        gameRoom.scores.player2 += points;
      }

      await gameRoom.save();

      // Notify both players
      io.to(roomId).emit("answer-received", {
        playerId: userId,
        isPlayer1,
        isCorrect,
        points,
        currentScores: gameRoom.scores,
      });

      // Check if both players answered
      const bothAnswered =
        currentQuestionData.player1Answer &&
        currentQuestionData.player1Answer.answer &&
        currentQuestionData.player2Answer &&
        currentQuestionData.player2Answer.answer;

      if (bothAnswered) {
        // Move to next question or end game
        await moveToNextQuestion(io, roomId, gameRoom, activeRooms);
      }
    } catch (error) {
      socket.emit("error", { message: "Failed to submit answer", error: error.message });
    }
  });

  // Start question timer
  const startQuestionTimer = async (io, roomId, questionIndex, questions, gameRoom, activeRooms) => {
    const roomData = activeRooms.get(roomId);
    if (!roomData) return;

    // Initialize timers if not exists
    if (!roomData.timers) {
      roomData.timers = {};
    }

    // Clear existing timer
    if (roomData.timers.questionTimer) {
      clearTimeout(roomData.timers.questionTimer);
    }

    roomData.questionStartTime = Date.now();
    activeRooms.set(roomId, roomData);

    // Send timer updates every second
    let timeRemaining = QUESTION_TIME_LIMIT;
    const timerInterval = setInterval(() => {
      timeRemaining--;
      io.to(roomId).emit("timer-update", { timeRemaining });

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        handleQuestionTimeout(io, roomId, questionIndex, questions, gameRoom, activeRooms);
      }
    }, 1000);

    roomData.timers.timerInterval = timerInterval;
    activeRooms.set(roomId, roomData);
  };

  // Handle question timeout
  const handleQuestionTimeout = async (
    io,
    roomId,
    questionIndex,
    questions,
    gameRoom,
    activeRooms
  ) => {
    const roomData = activeRooms.get(roomId);
    if (roomData && roomData.timers && roomData.timers.timerInterval) {
      clearInterval(roomData.timers.timerInterval);
    }

    // Mark unanswered questions as incorrect (0 points)
    const currentQuestionData = gameRoom.questions[questionIndex];
    if (!currentQuestionData.player1Answer || !currentQuestionData.player1Answer.answer) {
      currentQuestionData.player1Answer = {
        answer: null,
        answeredAt: new Date(),
        points: 0,
      };
    }
    if (!currentQuestionData.player2Answer || !currentQuestionData.player2Answer.answer) {
      currentQuestionData.player2Answer = {
        answer: null,
        answeredAt: new Date(),
        points: 0,
      };
    }

    await gameRoom.save();

    io.to(roomId).emit("question-timeout", {
      message: "Time's up!",
      currentScores: gameRoom.scores,
    });

    // Move to next question
    await moveToNextQuestion(io, roomId, gameRoom, activeRooms);
  };

  // Move to next question or end game
  const moveToNextQuestion = async (io, roomId, gameRoom, activeRooms) => {
    const roomData = activeRooms.get(roomId);
    if (roomData && roomData.timers && roomData.timers.timerInterval) {
      clearInterval(roomData.timers.timerInterval);
    }

    const nextIndex = gameRoom.currentQuestionIndex + 1;

    if (nextIndex >= gameRoom.questions.length) {
      // Game over
      await endGame(io, roomId, gameRoom, activeRooms);
    } else {
      // Next question
      gameRoom.currentQuestionIndex = nextIndex;
      await gameRoom.save();

      const nextQuestionId = gameRoom.questions[nextIndex].question;
      const nextQuestion = await Question.findById(nextQuestionId);

      const questionData = {
        question: nextQuestion.question,
        options: nextQuestion.options,
        category: nextQuestion.category,
        difficulty: nextQuestion.difficulty,
        questionIndex: nextIndex,
        totalQuestions: QUESTIONS_PER_GAME,
        timeLimit: QUESTION_TIME_LIMIT,
      };

      io.to(roomId).emit("next-question", {
        question: questionData,
        currentScores: gameRoom.scores,
      });

      // Start timer for next question
      const allQuestions = await Question.find({
        _id: { $in: gameRoom.questions.map((q) => q.question) },
      });
      startQuestionTimer(io, roomId, nextIndex, allQuestions, gameRoom, activeRooms);
    }
  };

  // End game
  const endGame = async (io, roomId, gameRoom, activeRooms) => {
    try {
      // Determine winner
      let winner = null;
      if (gameRoom.scores.player1 > gameRoom.scores.player2) {
        winner = gameRoom.player1;
      } else if (gameRoom.scores.player2 > gameRoom.scores.player1) {
        winner = gameRoom.player2;
      }

      gameRoom.status = "finished";
      gameRoom.finishedAt = new Date();
      await gameRoom.save();

      // Create game history
      const duration = Math.floor((gameRoom.finishedAt - gameRoom.startedAt) / 1000);
      const gameHistory = new GameHistory({
        roomId: gameRoom.roomId,
        players: [
          {
            user: gameRoom.player1,
            score: gameRoom.scores.player1,
            isWinner: winner && winner.toString() === gameRoom.player1.toString(),
          },
          {
            user: gameRoom.player2,
            score: gameRoom.scores.player2,
            isWinner: winner && winner.toString() === gameRoom.player2.toString(),
          },
        ],
        questions: gameRoom.questions.map((q) => ({
          question: q.question,
          player1Answer: {
            answer: q.player1Answer?.answer || null,
            isCorrect: q.player1Answer?.points > 0,
            points: q.player1Answer?.points || 0,
          },
          player2Answer: {
            answer: q.player2Answer?.answer || null,
            isCorrect: q.player2Answer?.points > 0,
            points: q.player2Answer?.points || 0,
          },
        })),
        winner: winner,
        duration,
        category: gameRoom.category,
      });

      await gameHistory.save();

      // Update user stats
      const player1 = await User.findById(gameRoom.player1);
      const player2 = await User.findById(gameRoom.player2);

      if (player1) {
        await player1.updateStats(
          winner && winner.toString() === gameRoom.player1.toString(),
          gameRoom.scores.player1
        );
      }
      if (player2) {
        await player2.updateStats(
          winner && winner.toString() === gameRoom.player2.toString(),
          gameRoom.scores.player2
        );
      }

      // Send game over event
      io.to(roomId).emit("game-ended", {
        winner: winner,
        scores: gameRoom.scores,
        gameHistory: gameHistory,
        duration,
      });

      // Clean up
      if (activeRooms.has(roomId)) {
        const roomData = activeRooms.get(roomId);
        if (roomData && roomData.timers && roomData.timers.timerInterval) {
          clearInterval(roomData.timers.timerInterval);
        }
        activeRooms.delete(roomId);
      }
    } catch (error) {
      console.error("Error ending game:", error);
      io.to(roomId).emit("error", { message: "Error ending game", error: error.message });
    }
  };
};

