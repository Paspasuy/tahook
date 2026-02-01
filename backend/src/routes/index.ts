import { Router } from "express";
import authRoutes from "./auth";
import quizRoutes from "./quiz";
import questionRoutes from "./question";
import resultRoutes from "./result";

const router = Router();

router.use("/auth", authRoutes);
router.use("/quizzes", quizRoutes);
router.use("/questions", questionRoutes);
router.use("/results", resultRoutes);

export default router;
