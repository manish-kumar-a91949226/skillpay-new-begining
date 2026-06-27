import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    githubLink: { type: String, required: true },
    demoLink: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // optional AI reviewer bonus feature
    aiReview: {
      summary: String,
      strengths: [String],
      suggestions: [String],
      codeQualityScore: Number,
      documentationScore: Number,
      innovationScore: Number,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ challengeId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
