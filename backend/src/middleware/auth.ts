import { Request, Response, NextFunction } from "express";
import { authService } from "../services/AuthService";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userName?: string;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    req.userId = decoded.userId;
    req.userName = decoded.name;

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);
      req.userId = decoded.userId;
      req.userName = decoded.name;
    }

    next();
  } catch {
    // Token invalid, but continue without auth
    next();
  }
};
