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

export const DEFAULT_CATEGORY_MMR = CATEGORIES.reduce((acc, category) => {
  acc[category] = 1200;
  return acc;
}, {});

export const TIERS = [
  { name: "Bronze", minRating: 0 },
  { name: "Silver", minRating: 1300 },
  { name: "Gold", minRating: 1500 },
  { name: "Platinum", minRating: 1700 },
  { name: "Diamond", minRating: 1900 },
  { name: "Elite", minRating: 2100 },
];

export const POWER_UP_TYPES = ["extra_time", "double_points", "skip"];

export const POWER_UP_CONFIG = {
  extra_time: {
    label: "Extra Time",
    description: "+5s on the timer",
    durationSeconds: 0,
    bonusSeconds: 5,
  },
  double_points: {
    label: "Double Points",
    description: "Doubles next correct answer",
    durationSeconds: 0,
  },
  skip: {
    label: "Auto Solve",
    description: "Skip question with base points",
    durationSeconds: 0,
  },
};

export const QUEST_TEMPLATES = {
  daily: [
    { id: "daily-win-2", description: "Win 2 matches", target: 2, reward: { powerUp: "extra_time" } },
    { id: "daily-score-800", description: "Score 800 points total", target: 800, reward: { xp: 150 } },
  ],
  weekly: [
    { id: "weekly-raid", description: "Complete 1 raid", target: 1, reward: { badge: "Raid Rookie" } },
  ],
};


