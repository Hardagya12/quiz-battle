import express from "express";
import Question from "../models/Question.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get questions with filters
router.get("/", async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query;

    const query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    query.status = "approved";

    const questions = await Question.find(query)
      .limit(parseInt(limit))
      .select("-correctAnswer"); // Don't send correct answer to client

    res.json({ questions, count: questions.length });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get question by ID (for game purposes, includes correct answer)
router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json({ question });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add question (protected)
router.post("/", authenticate, async (req, res) => {
  try {
    const { question, options, correctAnswer, category, difficulty, points } = req.body;

    if (!question || !options || !correctAnswer || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (options.length !== 4) {
      return res.status(400).json({ message: "Question must have exactly 4 options" });
    }

    if (!options.includes(correctAnswer)) {
      return res.status(400).json({ message: "Correct answer must be one of the options" });
    }

    const newQuestion = new Question({
      question,
      options,
      correctAnswer,
      category,
      difficulty: difficulty || "medium",
      points: points || 100,
      status: "approved",
    });

    await newQuestion.save();
    res.status(201).json({ message: "Question added successfully", question: newQuestion });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: errors.join(", ") });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get categories
router.get("/categories/list", async (req, res) => {
  try {
    const categories = await Question.distinct("category");
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Submit community question
router.post("/submit", authenticate, async (req, res) => {
  try {
    const { question, options, correctAnswer, category, difficulty } = req.body;
    if (!question || !options || !correctAnswer || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (options.length !== 4) {
      return res.status(400).json({ message: "Question must have exactly 4 options" });
    }
    const submission = new Question({
      question,
      options,
      correctAnswer,
      category,
      difficulty: difficulty || "medium",
      status: "pending",
      createdBy: req.user._id,
    });
    await submission.save();
    res.status(201).json({ message: "Question submitted for review", question: submission });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit question", error: error.message });
  }
});

// Vote on question
router.post("/:questionId/vote", authenticate, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { vote } = req.body; // "up" or "down"
    if (!["up", "down"].includes(vote)) {
      return res.status(400).json({ message: "Invalid vote" });
    }
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    if (!question.votes) {
      question.votes = { up: 0, down: 0 };
    }
    question.votes[vote] += 1;
    await question.save();
    res.json({ message: "Vote registered", votes: question.votes });
  } catch (error) {
    res.status(500).json({ message: "Failed to vote", error: error.message });
  }
});

// Trending questions/categories
router.get("/trending/list", async (req, res) => {
  try {
    const trending = await Question.aggregate([
      { $match: { status: "approved" } },
      {
        $project: {
          category: 1,
          score: { $subtract: ["$votes.up", "$votes.down"] },
        },
      },
      { $group: { _id: "$category", totalScore: { $sum: "$score" } } },
      { $sort: { totalScore: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      trending: trending.map((entry) => ({
        category: entry._id,
        score: entry.totalScore,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load trending categories", error: error.message });
  }
});

export default router;

