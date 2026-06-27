import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    reward: { type: Number, required: true, min: 1 }, // amount in XLM
    deadline: { type: Date, required: true },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    status: {
      type: String,
      enum: ["open", "funded", "closed"],
      default: "open",
    },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // on-chain linkage
    onChainId: { type: Number, default: null }, // u64 challenge id returned by create_challenge
    contractStatus: { type: String, enum: ["unfunded", "funded", "paid"], default: "unfunded" },
    fundingTxHash: { type: String, default: null },
  },
  { timestamps: true }
);

challengeSchema.index({ status: 1, deadline: 1 });

export default mongoose.model("Challenge", challengeSchema);
