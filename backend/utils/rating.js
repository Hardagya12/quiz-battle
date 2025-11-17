import { DEFAULT_CATEGORY_MMR, TIERS } from "./constants.js";

const clamp = (rating) => {
  const numeric = Number(rating);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return Math.max(0, Math.round(numeric));
};

const isMap = (value) => value && typeof value.get === "function" && typeof value.set === "function";

const getCategoryValue = (categories, category) => {
  if (!categories) return undefined;
  if (isMap(categories)) {
    return categories.get(category);
  }
  return categories[category];
};

const setCategoryValue = (categories, category, value) => {
  if (!categories) return;
  if (isMap(categories)) {
    categories.set(category, value);
  } else {
    categories[category] = value;
  }
};

const getAllCategoryRatings = (categories) => {
  if (!categories) return [];
  if (isMap(categories)) {
    return Array.from(categories.values());
  }
  return Object.values(categories);
};

export const getDefaultCategoryRatings = () => ({ ...DEFAULT_CATEGORY_MMR });

export const getTierFromRating = (rating) => {
  let tier = TIERS[0].name;
  for (const entry of TIERS) {
    if (rating >= entry.minRating) {
      tier = entry.name;
    } else {
      break;
    }
  }
  return tier;
};

export const calculateEloDelta = (playerRating, opponentRating, score, kFactor = 32) => {
  const expectedScore = 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
  return clamp(playerRating + kFactor * (score - expectedScore)) - clamp(playerRating);
};

export const applyMatchResultToRatings = ({
  user,
  isWinner,
  opponentRating,
  category = "General",
}) => {
  if (!user.stats.rating) {
    user.stats.rating = {
      overall: 1200,
      categories: getDefaultCategoryRatings(),
      tier: TIERS[0].name,
      tiersUnlocked: [TIERS[0].name],
    };
  }

  if (!user.stats.rating.categories) {
    user.stats.rating.categories = getDefaultCategoryRatings();
  }

  const currentCategoryRating = getCategoryValue(user.stats.rating.categories, category);
  const playerRating = Number.isFinite(currentCategoryRating) ? currentCategoryRating : 1200;
  const delta = calculateEloDelta(playerRating, opponentRating || 1200, isWinner ? 1 : 0);
  setCategoryValue(user.stats.rating.categories, category, clamp(playerRating + delta));

  const categoryRatings = getAllCategoryRatings(user.stats.rating.categories)
    .map((value) => (Number.isFinite(Number(value)) ? Number(value) : null))
    .filter((value) => value !== null);
  const avgRating =
    categoryRatings.length > 0
      ? Math.round(categoryRatings.reduce((sum, value) => sum + value, 0) / categoryRatings.length)
      : playerRating;

  user.stats.rating.overall = clamp(avgRating);
  const tier = getTierFromRating(avgRating);
  user.stats.rating.tier = tier;
  if (!user.stats.rating.tiersUnlocked?.includes(tier)) {
    user.stats.rating.tiersUnlocked = [...(user.stats.rating.tiersUnlocked || []), tier];
  }

  return delta;
};


