import type { Request, Response, NextFunction } from "express";
import {
  getAuthCookieName,
  getUserById,
  verifyToken,
} from "../services/auth/auth.service.js";
import type { AuthUser } from "../types/auth.types.js";
import { AppError } from "../utils/AppError.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[getAuthCookieName()];
    if (!token) {
      throw new AppError("Authentication required.", 401);
    }

    const payload = verifyToken(token);
    const user = await getUserById(payload.userId);
    if (!user) {
      throw new AppError("User not found. Please sign in again.", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[getAuthCookieName()];
    if (token) {
      const payload = verifyToken(token);
      const user = await getUserById(payload.userId);
      if (user) req.user = user;
    }
    next();
  } catch {
    next();
  }
}
