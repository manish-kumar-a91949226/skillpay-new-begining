import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["learner", "mentor"], required: true, default: "learner" },
    walletAddress: { type: String, required: true },
    walletSecret: { type: String, required: true, select: false }, // testnet only, see README security note
    totalRewards: { type: Number, default: 0 }, // in XLM
    challengesCompleted: { type: Number, default: 0 },
    badges: [{ type: String }],
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

export default mongoose.model("User", userSchema);
