import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional, allow anonymous feedback
    },
    email: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["bug", "feature", "general"],
      default: "general",
    },
    pageUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
