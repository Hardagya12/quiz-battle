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

export const TIERS = [
  { name: "Bronze", minRating: 0, color: "#CD7F32" },
  { name: "Silver", minRating: 1300, color: "#C0C0C0" },
  { name: "Gold", minRating: 1500, color: "#FFD700" },
  { name: "Platinum", minRating: 1700, color: "#7DD3FC" },
  { name: "Diamond", minRating: 1900, color: "#A78BFA" },
  { name: "Elite", minRating: 2100, color: "#F472B6" },
];

export const POWER_UPS = [
  {
    type: "extra_time",
    label: "Extra Time",
    description: "+5 seconds on the timer",
    color: "from-yellow-400 to-amber-500",
  },
  {
    type: "double_points",
    label: "Double Points",
    description: "Next correct answer is doubled",
    color: "from-purple-500 to-indigo-500",
  },
  {
    type: "skip",
    label: "Auto Solve",
    description: "Skip a question for base points",
    color: "from-emerald-500 to-green-500",
  },
];

export const MATCH_TYPES = [
  {
    id: "duel",
    title: "Ranked Duel",
    description: "Classic 1v1 competitive battle",
    maxPlayers: 2,
  },
  {
    id: "team",
    title: "Team Battle (2v2)",
    description: "Squad up and coordinate answers",
    maxPlayers: 4,
    comingSoon: true,
  },
  {
    id: "raid",
    title: "Raid Boss",
    description: "Co-op speedrun versus the Quiz Titan",
    maxPlayers: 2,
  },
];

export const QUEST_TYPES = {
  daily: [
    { id: "daily-win-2", description: "Win 2 matches", reward: "extra_time" },
    { id: "daily-score-800", description: "Score 800 points", reward: "xp" },
  ],
  weekly: [
    { id: "weekly-raid", description: "Defeat a raid boss", reward: "badge" },
  ],
};


