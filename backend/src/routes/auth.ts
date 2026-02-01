import { Router, Request, Response } from "express";
import { authService } from "../services/AuthService";
import { RegisterRequest, LoginRequest } from "../models/api/User";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const data: RegisterRequest = req.body;

    if (!data.name || !data.password) {
      res.status(400).json({ error: "Name and password are required" });
      return;
    }

    if (data.name.length < 3) {
      res.status(400).json({ error: "Name must be at least 3 characters" });
      return;
    }

    if (data.password.length < 4) {
      res.status(400).json({ error: "Password must be at least 4 characters" });
      return;
    }

    const result = await authService.register(data);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    res.status(400).json({ error: message });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const data: LoginRequest = req.body;

    if (!data.name || !data.password) {
      res.status(400).json({ error: "Name and password are required" });
      return;
    }

    const result = await authService.login(data);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(401).json({ error: message });
  }
});

// GET /api/auth/me
router.get(
  "/me",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await authService.getUserById(req.userId!);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: user.id,
        name: user.name,
        createdAt: user.createdAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user info" });
    }
  }
);

export default router;
