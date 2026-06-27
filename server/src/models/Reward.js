import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge", required: true },
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true }, // XLM
    txHash: { type: String, required: true },
    walletAddress: { type: String, required: true }, // learner's public key at time of payout
  },
  { timestamps: true }
);

export default mongoose.model("Reward", rewardSchema);
