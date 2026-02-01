import { Router, Response } from "express";
import { resultService } from "../services/ResultService";
import {
  authMiddleware,
  optionalAuthMiddleware,
  AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

// GET /api/results/quiz/:quizId - Get leaderboard for a quiz
router.get(
  "/quiz/:quizId",
  optionalAuthMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const leaderboard = await resultService.getResultsByQuiz(req.params.quizId);

      if (!leaderboard) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }

      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to get results" });
    }
  }
);

// GET /api/results/my - Get current user's results
router.get(
  "/my",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const results = await resultService.getResultsByUser(req.userId!);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to get results" });
    }
  }
);

// GET /api/results/:quizId - Get current user's result for a specific quiz
router.get(
  "/:quizId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await resultService.getResult(
        req.userId!,
        req.params.quizId
      );

      if (!result) {
        res.status(404).json({ error: "Result not found" });
        return;
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to get result" });
    }
  }
);

export default router;
