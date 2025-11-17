import GameRoom from "../models/GameRoom.js";
import GameHistory from "../models/GameHistory.js";
import Question from "../models/Question.js";
import User from "../models/User.js";
import { POWER_UP_CONFIG } from "../utils/constants.js";

const QUESTION_TIME_LIMIT = 20; // seconds
const QUESTIONS_PER_GAME = 10;
const GAME_START_DELAY_MS = 3000;
const MAX_EXTRA_TIME = QUESTION_TIME_LIMIT + 10;

const calculateScore = (isCorrect, timeRemaining, basePoints = 100) => {
  if (!isCorrect) return 0;
  const timeBonus = (timeRemaining / QUESTION_TIME_LIMIT) * 50;
  return Math.round(basePoints + timeBonus);
};

const getRoomData = (activeRooms, roomId) => {
  const roomData = activeRooms.get(roomId) || {
    timers: {},
    powerUps: {},
    questionBank: [],
  };
  if (!roomData.timers) {
    roomData.timers = {};
  }
  if (!roomData.powerUps) {
    roomData.powerUps = {};
  }
  return roomData;
};

const resetPowerUpFlags = (roomData) => {
  if (!roomData.powerUps) return;
  Object.keys(roomData.powerUps).forEach((playerId) => {
    roomData.powerUps[playerId].double_points = false;
    roomData.powerUps[playerId].skip = false;
  });
};

const clearTimer = (roomData, timerKey) => {
  if (roomData?.timers?.[timerKey]) {
    clearInterval(roomData.timers[timerKey]);
    delete roomData.timers[timerKey];
  }
};

const clearTimeoutRef = (roomData, timeoutKey) => {
  if (roomData?.timers?.[timeoutKey]) {
    clearTimeout(roomData.timers[timeoutKey]);
    delete roomData.timers[timeoutKey];
  }
};

const getQuestionFromCache = async (roomData, index, questionId) => {
  if (roomData.questionBank && roomData.questionBank[index]) {
    return roomData.questionBank[index];
  }
  return Question.findById(questionId);
};

const markUnansweredZero = (questionData) => {
  if (!questionData.player1Answer || !questionData.player1Answer.answer) {
    questionData.player1Answer = {
      answer: null,
      answeredAt: new Date(),
      points: 0,
    };
  }

  if (!questionData.player2Answer || !questionData.player2Answer.answer) {
    questionData.player2Answer = {
      answer: null,
      answeredAt: new Date(),
      points: 0,
    };
  }
};

const bothPlayersAnswered = (questionData) =>
  questionData.player1Answer?.answer && questionData.player2Answer?.answer;

const buildQuestionPayload = (questionDoc, index) => ({
  question: questionDoc.question,
  options: questionDoc.options,
  category: questionDoc.category,
  difficulty: questionDoc.difficulty,
  questionIndex: index,
  totalQuestions: QUESTIONS_PER_GAME,
  timeLimit: QUESTION_TIME_LIMIT,
});

export const handleGameEvents = (io, socket, activeRooms) => {
  socket.on("start-game", async ({ roomId, userId }) => {
    try {
      const gameRoom = await GameRoom.findOne({ roomId })
        .populate("player1", "username stats.rating")
        .populate("player2", "username stats.rating");

      if (!gameRoom) {
        return socket.emit("error", { message: "Room not found" });
      }

      const player1Id = gameRoom.player1._id?.toString() || gameRoom.player1.toString();
      const player2Id = gameRoom.player2?._id?.toString() || gameRoom.player2?.toString();
      const isPlayer1 = player1Id === userId;
      const isPlayer2 = player2Id === userId;

      if (!isPlayer1 && !isPlayer2) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      if (!gameRoom.player2) {
        return socket.emit("error", { message: "Waiting for opponent" });
      }

      if (!["waiting", "starting"].includes(gameRoom.status)) {
        return socket.emit("error", { message: "Game already started or finished" });
      }

      gameRoom.status = "starting";
      await gameRoom.save();

      const questions = await Question.aggregate([
        ...(gameRoom.category !== "General" ? [{ $match: { category: gameRoom.category } }] : []),
        { $sample: { size: QUESTIONS_PER_GAME } },
      ]);

      if (questions.length < QUESTIONS_PER_GAME) {
        console.error(`Not enough questions: found ${questions.length}, needed ${QUESTIONS_PER_GAME}`);
        gameRoom.status = "waiting";
        await gameRoom.save();
        return socket.emit("error", {
          message: `Not enough questions available (found ${questions.length}, need ${QUESTIONS_PER_GAME}). Please seed more questions or choose another category.`,
        });
      }

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

      const roomData = getRoomData(activeRooms, roomId);
      roomData.gameRoom = gameRoom;
      roomData.questionBank = questions;
      roomData.currentQuestionIndex = 0;
      roomData.timeRemaining = QUESTION_TIME_LIMIT;
      resetPowerUpFlags(roomData);
      activeRooms.set(roomId, roomData);

      const currentQuestion = questions[0];
      const questionData = buildQuestionPayload(currentQuestion, 0);

      io.to(roomId).emit("game-started", {
        room: gameRoom,
        question: questionData,
        startDelayMs: GAME_START_DELAY_MS,
      });

      io.to(roomId).emit("game-countdown", {
        duration: GAME_START_DELAY_MS,
        message: "Get ready! Battle begins shortly.",
      });

      clearTimeoutRef(roomData, "preQuestion");
      roomData.timers.preQuestion = setTimeout(() => {
        startQuestionTimer(io, roomId, 0, gameRoom, activeRooms);
      }, GAME_START_DELAY_MS);
      activeRooms.set(roomId, roomData);
    } catch (error) {
      console.error("Failed to start game", error);
      socket.emit("error", { message: "Failed to start game", error: error.message });
    }
  });

  socket.on("answer-question", async ({ roomId, userId, answer, timeRemaining }) => {
    try {
      const gameRoom = await GameRoom.findOne({ roomId });
      if (!gameRoom || gameRoom.status !== "active") {
        return socket.emit("error", { message: "Game not active" });
      }

      const roomData = getRoomData(activeRooms, roomId);
      const serverTimeRemaining =
        roomData?.timeRemaining !== undefined ? roomData.timeRemaining : QUESTION_TIME_LIMIT;
      const safeTime = Math.max(0, Math.min(serverTimeRemaining, timeRemaining ?? serverTimeRemaining));

      const isPlayer1 = gameRoom.player1.toString() === userId;
      const isPlayer2 = gameRoom.player2 && gameRoom.player2.toString() === userId;

      if (!isPlayer1 && !isPlayer2) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      const doublePointsActive = !!roomData.powerUps?.[userId]?.double_points;
      if (doublePointsActive && roomData.powerUps[userId]) {
        roomData.powerUps[userId].double_points = false;
      }
      activeRooms.set(roomId, roomData);

      await submitAnswer({
        io,
        roomId,
        gameRoom,
        userId,
        isPlayer1,
        answer,
        timeRemaining: safeTime,
        activeRooms,
        modifiers: {
          doublePoints: doublePointsActive,
        },
      });
    } catch (error) {
      console.error("Failed to submit answer", error);
      socket.emit("error", { message: "Failed to submit answer", error: error.message });
    }
  });

  socket.on("use-powerup", async ({ roomId, userId, type }) => {
    try {
      const gameRoom = await GameRoom.findOne({ roomId });
      if (!gameRoom || gameRoom.status !== "active") {
        return socket.emit("error", { message: "Game not active" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return socket.emit("error", { message: "User not found" });
      }

      const inventory = user.powerUps.find((entry) => entry.type === type);
      if (!inventory || inventory.quantity <= 0) {
        return socket.emit("error", { message: "Power-up not available" });
      }

      const isPlayer1 = gameRoom.player1.toString() === userId;
      const isPlayer2 = gameRoom.player2 && gameRoom.player2.toString() === userId;
      if (!isPlayer1 && !isPlayer2) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      const roomData = getRoomData(activeRooms, roomId);
      const currentQuestion = gameRoom.questions[gameRoom.currentQuestionIndex];
      const answerKey = isPlayer1 ? "player1Answer" : "player2Answer";
      if (currentQuestion[answerKey]?.answer) {
        return socket.emit("error", { message: "You already answered this question" });
      }

      inventory.quantity -= 1;
      await user.save();

      roomData.powerUps[userId] = roomData.powerUps[userId] || {};

      switch (type) {
        case "extra_time": {
          const bonus = POWER_UP_CONFIG.extra_time.bonusSeconds || 5;
          roomData.timeRemaining = Math.min(
            (roomData.timeRemaining || QUESTION_TIME_LIMIT) + bonus,
            MAX_EXTRA_TIME
          );
          activeRooms.set(roomId, roomData);
          io.to(roomId).emit("timer-update", { timeRemaining: roomData.timeRemaining });
          io.to(roomId).emit("powerup-used", { userId, type, meta: { bonus } });
          break;
        }
        case "double_points": {
          roomData.powerUps[userId].double_points = true;
          activeRooms.set(roomId, roomData);
          io.to(roomId).emit("powerup-used", { userId, type });
          break;
        }
        case "skip": {
          roomData.powerUps[userId].skip = true;
          activeRooms.set(roomId, roomData);
          io.to(roomId).emit("powerup-used", { userId, type });
          await submitAnswer({
            io,
            roomId,
            gameRoom,
            userId,
            isPlayer1,
            answer: "__SKIP__",
            timeRemaining: roomData.timeRemaining ?? QUESTION_TIME_LIMIT,
            activeRooms,
            modifiers: {
              forceCorrect: true,
              skipBasePoints: true,
              usedPowerup: "skip",
            },
          });
          break;
        }
        default:
          socket.emit("error", { message: "Power-up not supported" });
      }
    } catch (error) {
      console.error("Failed to use power-up", error);
      socket.emit("error", { message: "Failed to use power-up", error: error.message });
    }
  });

  const submitAnswer = async ({
    io,
    roomId,
    gameRoom,
    userId,
    isPlayer1,
    answer,
    timeRemaining,
    activeRooms,
    modifiers = {},
  }) => {
    const roomData = getRoomData(activeRooms, roomId);
    const currentIndex = gameRoom.currentQuestionIndex;
    const currentQuestionData = gameRoom.questions[currentIndex];

    if (!currentQuestionData) {
      throw new Error("Invalid question data");
    }

    const answerKey = isPlayer1 ? "player1Answer" : "player2Answer";
    if (currentQuestionData[answerKey]?.answer) {
      return;
    }

    const questionDoc = await getQuestionFromCache(
      roomData,
      currentIndex,
      currentQuestionData.question
    );

    if (!questionDoc) {
      throw new Error("Question not found");
    }

    const isCorrect = modifiers.forceCorrect || questionDoc.correctAnswer === answer;
    let points = calculateScore(isCorrect, timeRemaining, questionDoc.points);

    if (modifiers.skipBasePoints) {
      points = questionDoc.points;
    }

    if (modifiers.doublePoints && points > 0) {
      points *= 2;
    }

    currentQuestionData[answerKey] = {
      answer: isCorrect ? questionDoc.correctAnswer : answer,
      answeredAt: new Date(),
      points,
      usedPowerup: modifiers.usedPowerup || (modifiers.doublePoints ? "double_points" : null),
    };

    if (isPlayer1) {
      gameRoom.scores.player1 += points;
    } else {
      gameRoom.scores.player2 += points;
    }

    await gameRoom.save();

    io.to(roomId).emit("answer-received", {
      playerId: userId,
      isPlayer1,
      isCorrect,
      points,
      currentScores: gameRoom.scores,
    });

    if (bothPlayersAnswered(currentQuestionData)) {
      await moveToNextQuestion(io, roomId, gameRoom, activeRooms);
    }
  };

  const startQuestionTimer = (io, roomId, questionIndex, gameRoom, activeRooms) => {
    const roomData = getRoomData(activeRooms, roomId);
    clearTimer(roomData, "timerInterval");
    roomData.timeRemaining = QUESTION_TIME_LIMIT;
    roomData.questionStartTime = Date.now();

    const timerInterval = setInterval(() => {
      roomData.timeRemaining -= 1;
      io.to(roomId).emit("timer-update", { timeRemaining: roomData.timeRemaining });

      if (roomData.timeRemaining <= 0) {
        clearInterval(timerInterval);
        delete roomData.timers.timerInterval;
        handleQuestionTimeout(io, roomId, questionIndex, gameRoom, activeRooms);
      }
    }, 1000);

    roomData.timers.timerInterval = timerInterval;
    activeRooms.set(roomId, roomData);
  };

  const handleQuestionTimeout = async (io, roomId, questionIndex, gameRoom, activeRooms) => {
    const roomData = getRoomData(activeRooms, roomId);
    clearTimer(roomData, "timerInterval");

    const currentQuestionData = gameRoom.questions[questionIndex];
    if (!currentQuestionData) {
      return;
    }

    markUnansweredZero(currentQuestionData);
    await gameRoom.save();

    io.to(roomId).emit("question-timeout", {
      message: "Time's up!",
      currentScores: gameRoom.scores,
    });

    await moveToNextQuestion(io, roomId, gameRoom, activeRooms);
  };

  const moveToNextQuestion = async (io, roomId, gameRoom, activeRooms) => {
    const roomData = getRoomData(activeRooms, roomId);
    clearTimer(roomData, "timerInterval");

    const nextIndex = gameRoom.currentQuestionIndex + 1;

    if (nextIndex >= gameRoom.questions.length) {
      await endGame(io, roomId, gameRoom, activeRooms);
      return;
    }

    gameRoom.currentQuestionIndex = nextIndex;
    await gameRoom.save();

    const nextQuestionDoc = await getQuestionFromCache(
      roomData,
      nextIndex,
      gameRoom.questions[nextIndex].question
    );

    const questionData = buildQuestionPayload(nextQuestionDoc, nextIndex);

    resetPowerUpFlags(roomData);
    activeRooms.set(roomId, roomData);

    io.to(roomId).emit("next-question", {
      question: questionData,
      currentScores: gameRoom.scores,
    });

    startQuestionTimer(io, roomId, nextIndex, gameRoom, activeRooms);
  };

  const endGame = async (io, roomId, gameRoom, activeRooms) => {
    try {
      const matchType = gameRoom.matchType || "duel";
      let winner = null;
      let raidOutcome = null;
      if (matchType === "raid") {
        const bossHp = gameRoom.raidMeta?.bossHp || 1000;
        const damage = (gameRoom.scores.player1 || 0) + (gameRoom.scores.player2 || 0);
        const success = damage >= bossHp;
        raidOutcome = { bossHp, damageDealt: damage, success };
      } else if (gameRoom.scores.player1 > gameRoom.scores.player2) {
        winner = gameRoom.player1;
      } else if (gameRoom.scores.player2 > gameRoom.scores.player1) {
        winner = gameRoom.player2;
      }

      gameRoom.status = "finished";
      gameRoom.finishedAt = new Date();
      await gameRoom.save();

      const duration = Math.floor((gameRoom.finishedAt - gameRoom.startedAt) / 1000);
      const highlightQuestionIndex = gameRoom.questions.findIndex((q) => {
        const p1 = q.player1Answer?.points || 0;
        const p2 = q.player2Answer?.points || 0;
        return Math.abs(p1 - p2) >= 100;
      });

      const gameHistory = new GameHistory({
        roomId: gameRoom.roomId,
        players: [
          {
            user: gameRoom.player1,
            score: gameRoom.scores.player1,
            isWinner:
              matchType === "raid"
                ? raidOutcome?.success
                : winner && winner.toString() === gameRoom.player1.toString(),
          },
          {
            user: gameRoom.player2,
            score: gameRoom.scores.player2,
            isWinner:
              matchType === "raid"
                ? raidOutcome?.success
                : winner && winner.toString() === gameRoom.player2.toString(),
          },
        ],
        questions: gameRoom.questions.map((q, index) => ({
          question: q.question,
          player1Answer: {
            answer: q.player1Answer?.answer || null,
            isCorrect: q.player1Answer?.points > 0,
            points: q.player1Answer?.points || 0,
            usedPowerup: q.player1Answer?.usedPowerup || null,
          },
          player2Answer: {
            answer: q.player2Answer?.answer || null,
            isCorrect: q.player2Answer?.points > 0,
            points: q.player2Answer?.points || 0,
            usedPowerup: q.player2Answer?.usedPowerup || null,
          },
          index,
        })),
        winner,
        duration,
        category: gameRoom.category,
        matchType,
        raidMeta: raidOutcome,
        highlights: {
          clutchQuestion: highlightQuestionIndex,
          margin: Math.abs(gameRoom.scores.player1 - gameRoom.scores.player2),
        },
        shareLink: `/share/${gameRoom.roomId}`,
      });

      await gameHistory.save();

      const player1 = await User.findById(gameRoom.player1);
      const player2 = await User.findById(gameRoom.player2);

      const p1Rating = player1?.stats?.rating?.overall || 1200;
      const p2Rating = player2?.stats?.rating?.overall || 1200;

      const player1Win =
        matchType === "raid"
          ? raidOutcome?.success
          : winner && winner.toString() === gameRoom.player1.toString();
      const player2Win =
        matchType === "raid"
          ? raidOutcome?.success
          : winner && winner.toString() === gameRoom.player2.toString();

      if (player1) {
        await player1.updateStats({
          isWinner: player1Win,
          score: gameRoom.scores.player1,
          category: gameRoom.category,
          opponentRating: p2Rating,
        });
      }
      if (player2) {
        await player2.updateStats({
          isWinner: player2Win,
          score: gameRoom.scores.player2,
          category: gameRoom.category,
          opponentRating: p1Rating,
        });
      }

      io.to(roomId).emit("game-ended", {
        winner,
        scores: gameRoom.scores,
        gameHistory,
        duration,
        matchType,
        raidMeta: raidOutcome,
      });

      if (activeRooms.has(roomId)) {
        const roomData = getRoomData(activeRooms, roomId);
        clearTimer(roomData, "timerInterval");
        clearTimeoutRef(roomData, "preQuestion");
        activeRooms.delete(roomId);
      }
    } catch (error) {
      console.error("Error ending game:", error);
      io.to(roomId).emit("error", { message: "Error ending game", error: error.message });
    }
  };
};

