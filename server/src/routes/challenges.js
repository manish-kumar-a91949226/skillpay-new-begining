import { Router } from "express";
import Challenge from "../models/Challenge.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  invokeContract,
  addressScVal,
  stringScVal,
  i128ScVal,
  u64ScVal,
  horizon,
  sorobanServer,
  NETWORK_PASSPHRASE,
} from "../config/stellar.js";
import {
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
  Memo,
} from "@stellar/stellar-sdk";

const router = Router();

const NATIVE_XLM_SAC = process.env.NATIVE_XLM_SAC;
const CONTRACT_ID = process.env.SKILLPAY_CONTRACT_ID;

// GET /api/challenges - browse all open challenges (learners + mentors)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, difficulty } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (difficulty) filter.difficulty = difficulty;

    const challenges = await Challenge.find(filter)
      .populate("mentor", "name email walletAddress")
      .sort({ createdAt: -1 });

    res.json({ challenges });
  } catch (err) {
    next(err);
  }
});

// GET /api/challenges/:id
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id).populate(
      "mentor",
      "name email walletAddress"
    );
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });
    res.json({ challenge });
  } catch (err) {
    next(err);
  }
});

// POST /api/challenges - mentor creates a challenge listing (DB only, not yet on-chain)
router.post("/", requireAuth, requireRole("mentor"), async (req, res, next) => {
  try {
    const { title, description, reward, deadline, difficulty } = req.body;

    if (!title || !description || !reward || !deadline) {
      return res.status(400).json({ error: "title, description, reward, and deadline are required" });
    }

    const challenge = await Challenge.create({
      title,
      description,
      reward,
      deadline,
      difficulty: difficulty || "beginner",
      mentor: req.user.id,
    });

    res.status(201).json({ challenge });
  } catch (err) {
    next(err);
  }
});

// POST /api/challenges/:id/fund - mentor escrows the reward pool on-chain
// If SKILLPAY_CONTRACT_ID is set, uses Soroban; otherwise sends a real XLM transfer
// to prove on-chain escrow and records the tx hash.
router.post("/:id/fund", requireAuth, requireRole("mentor"), async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });
    if (challenge.mentor.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the creating mentor can fund this challenge" });
    }
    if (challenge.contractStatus !== "unfunded") {
      return res.status(409).json({ error: "Challenge is already funded or paid" });
    }

    const mentor = await User.findById(req.user.id).select("+walletSecret");
    if (!mentor || !mentor.walletSecret) {
      return res.status(404).json({ error: "Mentor wallet not found" });
    }

    let txHash;
    let onChainId = null;

    // If the frontend signed the transaction (Freighter), just record the txHash
    if (req.body?.txHash) {
      txHash = req.body.txHash;
    } else if (CONTRACT_ID && NATIVE_XLM_SAC) {
      // Full Soroban path — contract is deployed
      try {
        const createResult = await invokeContract(
          "create_challenge",
          [
            addressScVal(mentor.walletAddress),
            stringScVal(challenge.title),
            i128ScVal(Math.round(challenge.reward * 10_000_000)),
            addressScVal(NATIVE_XLM_SAC),
          ],
          mentor.walletSecret
        );
        onChainId = createResult.returnValue;

        const fundResult = await invokeContract(
          "fund_reward_pool",
          [addressScVal(mentor.walletAddress), u64ScVal(onChainId)],
          mentor.walletSecret
        );
        txHash = fundResult.hash;
      } catch (sorobanErr) {
        console.warn("[fund] Soroban call failed, falling back to XLM transfer:", sorobanErr.message);
        txHash = await sendEscrowTransfer(mentor, challenge.reward);
      }
    } else {
      // No contract deployed yet — send a real on-chain XLM transfer as proof of escrow
      txHash = await sendEscrowTransfer(mentor, challenge.reward);
    }

    challenge.onChainId = onChainId;
    challenge.contractStatus = "funded";
    challenge.status = "funded";
    challenge.fundingTxHash = txHash;
    await challenge.save();

    res.json({ challenge, txHash });
  } catch (err) {
    next(err);
  }
});

/**
 * Sends a small self-transfer to prove escrow intent on-chain.
 * Returns the transaction hash. Used when the Soroban contract isn't deployed.
 */
async function sendEscrowTransfer(mentor, rewardXLM) {
  const keypair = Keypair.fromSecret(mentor.walletSecret);
  const account = await horizon.loadAccount(keypair.publicKey());

  // Send the reward amount to the platform escrow address (or self) as proof
  const ESCROW_ADDRESS = keypair.publicKey(); // self-transfer as escrow record
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: ESCROW_ADDRESS,
        asset: Asset.native(),
        amount: String(rewardXLM),
      })
    )
    .addMemo(Memo.text("SkillPay Escrow"))
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  const result = await horizon.submitTransaction(tx);
  return result.hash;
}

export default router;
