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

function getRequestToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[getAuthCookieName()];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    return token.length > 0 ? token : undefined;
  }

  return undefined;
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = getRequestToken(req);
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
    const token = getRequestToken(req);
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
