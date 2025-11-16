export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const CATEGORIES = [
  "General",
  "Science",
  "History",
  "Sports",
  "Geography",
  "Entertainment",
  "Technology",
  "Mathematics",
];

export const DIFFICULTIES = ["easy", "medium", "hard"];

export const QUESTION_TIME_LIMIT = 20; // seconds
export const QUESTIONS_PER_GAME = 10;

