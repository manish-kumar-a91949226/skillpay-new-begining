import { Router } from "express";
import Submission from "../models/Submission.js";
import Challenge from "../models/Challenge.js";
import User from "../models/User.js";
import Reward from "../models/Reward.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { invokeContract, addressScVal, u64ScVal, horizon, NETWORK_PASSPHRASE } from "../config/stellar.js";
import { reviewWithGemini } from "../utils/aiReviewer.js";
import { Keypair, TransactionBuilder, BASE_FEE, Operation, Asset, Memo } from "@stellar/stellar-sdk";

const router = Router();
const CONTRACT_ID = process.env.SKILLPAY_CONTRACT_ID;

// POST /api/submissions - learner submits a project for a challenge
router.post("/", requireAuth, requireRole("learner"), async (req, res, next) => {
  try {
    const { challengeId, githubLink, demoLink, notes } = req.body;
    if (!challengeId || !githubLink) {
      return res.status(400).json({ error: "challengeId and githubLink are required" });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });

    const existing = await Submission.findOne({ challengeId, userId: req.user.id });
    if (existing) {
      return res.status(409).json({ error: "You have already submitted to this challenge" });
    }

    const submission = await Submission.create({
      challengeId,
      userId: req.user.id,
      githubLink,
      demoLink,
      notes,
    });

    // Optional bonus: AI reviewer (Gemini). Silently skipped if no API key set.
    reviewWithGemini({ githubLink, demoLink, notes, title: challenge.title })
      .then(async (aiReview) => {
        if (aiReview) {
          submission.aiReview = aiReview;
          await submission.save();
        }
      })
      .catch((err) => console.warn("[ai-reviewer] skipped:", err.message));

    res.status(201).json({ submission });
  } catch (err) {
    next(err);
  }
});

// GET /api/submissions/mine - learner's own submissions
router.get("/mine", requireAuth, requireRole("learner"), async (req, res, next) => {
  try {
    const submissions = await Submission.find({ userId: req.user.id })
      .populate("challengeId", "title reward status")
      .sort({ createdAt: -1 });
    res.json({ submissions });
  } catch (err) {
    next(err);
  }
});

// GET /api/submissions/challenge/:challengeId - mentor views submissions for their challenge
router.get(
  "/challenge/:challengeId",
  requireAuth,
  requireRole("mentor"),
  async (req, res, next) => {
    try {
      const challenge = await Challenge.findById(req.params.challengeId);
      if (!challenge) return res.status(404).json({ error: "Challenge not found" });
      if (challenge.mentor.toString() !== req.user.id) {
        return res.status(403).json({ error: "Not your challenge" });
      }

      const submissions = await Submission.find({ challengeId: req.params.challengeId })
        .populate("userId", "name email walletAddress")
        .sort({ createdAt: -1 });

      res.json({ submissions });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/submissions/:id/approve - mentor approves -> triggers on-chain reward release
router.patch("/:id/approve", requireAuth, requireRole("mentor"), async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    const challenge = await Challenge.findById(submission.challengeId);
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });
    if (challenge.mentor.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not your challenge" });
    }
    if (challenge.contractStatus !== "funded") {
      return res.status(409).json({ error: "Challenge reward pool is not funded yet" });
    }
    if (submission.status !== "pending") {
      return res.status(409).json({ error: "Submission has already been reviewed" });
    }

    const mentor = await User.findById(req.user.id).select("+walletSecret");
    const learner = await User.findById(submission.userId);

    let txHash;
    if (CONTRACT_ID && mentor?.walletSecret && challenge.onChainId !== null && challenge.onChainId !== undefined) {
      // Soroban path
      try {
        const result = await invokeContract(
          "release_reward",
          [
            addressScVal(mentor.walletAddress),
            u64ScVal(challenge.onChainId),
            addressScVal(learner.walletAddress),
          ],
          mentor.walletSecret
        );
        txHash = result.hash;
      } catch (sorobanErr) {
        console.warn("[approve] Soroban failed, falling back to XLM payment:", sorobanErr.message);
        txHash = await sendRewardPayment(mentor, learner.walletAddress, challenge.reward);
      }
    } else {
      // No deployed contract — send real XLM to learner as reward
      txHash = await sendRewardPayment(mentor, learner.walletAddress, challenge.reward);
    }

    submission.status = "approved";
    await submission.save();

    challenge.contractStatus = "paid";
    challenge.status = "closed";
    await challenge.save();

    await Reward.create({
      challengeId: challenge._id,
      learnerId: learner._id,
      amount: challenge.reward,
      txHash,
      walletAddress: learner.walletAddress,
    });

    learner.totalRewards += challenge.reward;
    learner.challengesCompleted += 1;
    await learner.save();

    res.json({ submission, txHash });
  } catch (err) {
    next(err);
  }
});

async function sendRewardPayment(mentor, learnerAddress, rewardXLM) {
  const keypair = Keypair.fromSecret(mentor.walletSecret);
  const account = await horizon.loadAccount(keypair.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: learnerAddress,
        asset: Asset.native(),
        amount: String(rewardXLM),
      })
    )
    .addMemo(Memo.text("SkillPay Reward"))
    .setTimeout(30)
    .build();
  tx.sign(keypair);
  const result = await horizon.submitTransaction(tx);
  return result.hash;
}

// PATCH /api/submissions/:id/reject
router.patch("/:id/reject", requireAuth, requireRole("mentor"), async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    const challenge = await Challenge.findById(submission.challengeId);
    if (challenge.mentor.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not your challenge" });
    }

    submission.status = "rejected";
    await submission.save();
    res.json({ submission });
  } catch (err) {
    next(err);
  }
});

export default router;
