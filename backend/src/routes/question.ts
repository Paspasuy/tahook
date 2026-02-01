import { Router, Response } from "express";
import { questionService } from "../services/QuestionService";
import {
  CreateQuestionRequest,
  UpdateQuestionRequest,
} from "../models/api/Question";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// POST /api/questions - Create a new question
router.post(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data: CreateQuestionRequest = req.body;

      if (!data.quizId) {
        res.status(400).json({ error: "Quiz ID is required" });
        return;
      }

      if (!data.text || data.text.trim().length === 0) {
        res.status(400).json({ error: "Question text is required" });
        return;
      }

      if (!data.options || data.options.length < 2) {
        res.status(400).json({ error: "At least 2 options are required" });
        return;
      }

      const hasCorrect = data.options.some((opt) => opt.isCorrect);
      if (!hasCorrect) {
        res.status(400).json({ error: "At least one correct answer is required" });
        return;
      }

      const question = await questionService.createQuestion(data, req.userId!);
      res.status(201).json(question);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create question";
      res.status(400).json({ error: message });
    }
  }
);

// GET /api/questions/quiz/:quizId - Get all questions for a quiz
router.get(
  "/quiz/:quizId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const questions = await questionService.getQuestionsByQuiz(
        req.params.quizId
      );
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get questions" });
    }
  }
);

// GET /api/questions/:id - Get a single question
router.get(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const question = await questionService.getQuestionById(req.params.id);

      if (!question) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      res.json(question);
    } catch (error) {
      res.status(500).json({ error: "Failed to get question" });
    }
  }
);

// PUT /api/questions/:id - Update a question
router.put(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data: UpdateQuestionRequest = req.body;
      const question = await questionService.updateQuestion(
        req.params.id,
        data,
        req.userId!
      );

      if (!question) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      res.json(question);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update question";
      res.status(400).json({ error: message });
    }
  }
);

// DELETE /api/questions/:id - Delete a question
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = await questionService.deleteQuestion(
        req.params.id,
        req.userId!
      );

      if (!deleted) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete question";
      res.status(400).json({ error: message });
    }
  }
);

// POST /api/questions/reorder - Reorder questions
router.post(
  "/reorder",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { quizId, questionIds } = req.body;

      if (!quizId || !questionIds || !Array.isArray(questionIds)) {
        res.status(400).json({ error: "quizId and questionIds are required" });
        return;
      }

      await questionService.reorderQuestions(quizId, questionIds, req.userId!);
      res.json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reorder questions";
      res.status(400).json({ error: message });
    }
  }
);

export default router;
