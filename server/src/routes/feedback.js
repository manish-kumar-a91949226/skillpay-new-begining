import { Router } from "express";
import Feedback from "../models/Feedback.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/feedback
router.post("/", async (req, res, next) => {
  try {
    const { email, message, type, pageUrl } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Try to get userId if the user is authenticated (pass through an optional auth middleware if needed,
    // but since we want to allow unauthenticated feedback too, we'll just check if req.user exists.
    // If we use requireAuth, it's forced. We will make auth optional here.
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Decode JWT optionally here if we wanted to link to user, but for simplicity
      // we'll just rely on the client sending user data if available.
    }

    const feedback = await Feedback.create({
      userId: req.user ? req.user.id : undefined,
      email,
      message,
      type: type || "general",
      pageUrl,
    });

    res.status(201).json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback (admin only)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    // Basic protection - could be improved with actual role checks
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json({ feedback });
  } catch (err) {
    next(err);
  }
});

export default router;
