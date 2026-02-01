import { Router, Response } from "express";
import { quizService } from "../services/QuizService";
import { CreateQuizRequest, UpdateQuizRequest } from "../models/api/Quiz";
import {
  authMiddleware,
  optionalAuthMiddleware,
  AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

// POST /api/quizzes - Create a new quiz
router.post(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data: CreateQuizRequest = req.body;

      if (!data.title || data.title.trim().length === 0) {
        res.status(400).json({ error: "Title is required" });
        return;
      }

      const quiz = await quizService.createQuiz(req.userId!, data);
      res.status(201).json(quiz);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create quiz";
      res.status(400).json({ error: message });
    }
  }
);

// GET /api/quizzes - Get all published quizzes
router.get(
  "/",
  optionalAuthMiddleware,
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const quizzes = await quizService.getPublishedQuizzes();
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get quizzes" });
    }
  }
);

// GET /api/quizzes/my - Get current user's quizzes
router.get(
  "/my",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const quizzes = await quizService.getQuizzesByOwner(req.userId!);
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get quizzes" });
    }
  }
);

// GET /api/quizzes/:id - Get a single quiz
router.get(
  "/:id",
  optionalAuthMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const quiz = await quizService.getQuizWithQuestions(req.params.id);

      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }

      // Only owner can see unpublished quizzes
      if (!quiz.isPublished && quiz.ownerId !== req.userId) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }

      res.json(quiz);
    } catch (error) {
      res.status(500).json({ error: "Failed to get quiz" });
    }
  }
);

// PUT /api/quizzes/:id - Update a quiz
router.put(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data: UpdateQuizRequest = req.body;
      const quiz = await quizService.updateQuiz(req.params.id, req.userId!, data);

      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }

      res.json(quiz);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update quiz";
      res.status(400).json({ error: message });
    }
  }
);

// POST /api/quizzes/:id/publish - Publish a quiz
router.post(
  "/:id/publish",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const quiz = await quizService.publishQuiz(req.params.id, req.userId!);

      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }

      res.json(quiz);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to publish quiz";
      res.status(400).json({ error: message });
    }
  }
);

// DELETE /api/quizzes/:id - Delete a quiz
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = await quizService.deleteQuiz(req.params.id, req.userId!);

      if (!deleted) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete quiz" });
    }
  }
);

export default router;
