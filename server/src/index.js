import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import challengeRoutes from "./routes/challenges.js";
import submissionRoutes from "./routes/submissions.js";
import profileRoutes from "./routes/profile.js";
import feedbackRoutes from "./routes/feedback.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", apiLimiter);

app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/feedback", feedbackRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));
});
