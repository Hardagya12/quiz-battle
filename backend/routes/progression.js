import express from "express";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { QUEST_TEMPLATES } from "../utils/constants.js";

const router = express.Router();

const ensureProgressionStructure = (user) => {
  if (!user.progression) {
    user.progression = {};
  }
  if (!user.progression.badges) {
    user.progression.badges = [];
  }
  if (!user.progression.seasonPass) {
    user.progression.seasonPass = { level: 1, xp: 0, nextRewardAt: 500 };
  }
};

const resetQuestsIfNeeded = (user, scope = "daily") => {
  ensureProgressionStructure(user);
  if (!user.progression[scope]) {
    user.progression[scope] = { resetAt: null, quests: [] };
  }

  const now = new Date();
  const scopeData = user.progression?.[scope];

  const isExpired =
    !scopeData?.resetAt ||
    (scope === "daily" && now - scopeData.resetAt > 24 * 60 * 60 * 1000) ||
    (scope === "weekly" && now - scopeData.resetAt > 7 * 24 * 60 * 60 * 1000);

  if (!isExpired) return;

  user.progression[scope] = {
    resetAt: now,
    quests: QUEST_TEMPLATES[scope].map((template) => ({
      id: template.id,
      description: template.description,
      target: template.target || 1,
      progress: 0,
      reward: template.reward ? { ...template.reward } : {},
      completed: false,
      claimed: false,
    })),
  };
};

router.get("/me", authenticate, async (req, res) => {
  try {
    resetQuestsIfNeeded(req.user, "daily");
    resetQuestsIfNeeded(req.user, "weekly");
    await req.user.save();

    res.json({
      progression: req.user.progression,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load progression", error: error.message });
  }
});

router.post("/quests/:questId/claim", authenticate, async (req, res) => {
  try {
    const { questId } = req.params;
    const scopes = ["daily", "weekly"];
    let updated = false;

    ensureProgressionStructure(req.user);

    for (const scope of scopes) {
      const quests = req.user.progression?.[scope]?.quests || [];
      const quest = quests.find((q) => q.id === questId);
      if (quest && quest.completed && !quest.claimed) {
        quest.claimed = true;
        if (quest.reward?.powerUp) {
          req.user.grantPowerUp(quest.reward.powerUp, 1);
        }
        updated = true;
      }
    }

    if (!updated) {
      return res.status(400).json({ message: "Quest not ready to claim" });
    }

    await req.user.save();
    res.json({ message: "Reward claimed", progression: req.user.progression });
  } catch (error) {
    res.status(500).json({ message: "Failed to claim reward", error: error.message });
  }
});

router.post("/badges/:badgeId/toggle", authenticate, async (req, res) => {
  try {
    const { badgeId } = req.params;
    ensureProgressionStructure(req.user);
    const badge = req.user.progression?.badges?.find((b) => b.id === badgeId);
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }

    req.user.progression.badges = req.user.progression.badges.map((b) => ({
      ...b.toObject?.() || b,
      equipped: b.id === badgeId ? !badge.equipped : false,
    }));

    await req.user.save();
    res.json({ badges: req.user.progression.badges });
  } catch (error) {
    res.status(500).json({ message: "Failed to update badge", error: error.message });
  }
});

export default router;


