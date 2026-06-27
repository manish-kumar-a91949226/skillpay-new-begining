import { Router } from "express";
import User from "../models/User.js";
import Reward from "../models/Reward.js";
import { requireAuth } from "../middleware/auth.js";
import { getBalance } from "../config/stellar.js";

const router = Router();

// GET /api/profile/me - current user's full profile
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const balance = await getBalance(user.walletAddress).catch(() => "0");
    const rewards = await Reward.find({ learnerId: user._id }).populate("challengeId", "title");

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        balance,
        totalRewards: user.totalRewards,
        challengesCompleted: user.challengesCompleted,
        badges: user.badges,
      },
      rewards,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/profile/balance - fast real-time balance check
router.get("/balance", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const balance = await getBalance(user.walletAddress).catch(() => "0");
    res.json({ balance, walletAddress: user.walletAddress });
  } catch (err) {
    next(err);
  }
});

// GET /api/profile/:id - public profile (no email/wallet secret exposed)
router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const rewards = await Reward.find({ learnerId: user._id }).populate("challengeId", "title");

    res.json({
      profile: {
        name: user.name,
        role: user.role,
        walletAddress: user.walletAddress,
        totalRewards: user.totalRewards,
        challengesCompleted: user.challengesCompleted,
        badges: user.badges,
        memberSince: user.createdAt,
      },
      rewards,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/rewards - global settlement feed (used by the dashboard ticker)
router.get("/feed/recent", async (req, res, next) => {
  try {
    const rewards = await Reward.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("learnerId", "name")
      .populate("challengeId", "title");
    res.json({ rewards });
  } catch (err) {
    next(err);
  }
});

export default router;
