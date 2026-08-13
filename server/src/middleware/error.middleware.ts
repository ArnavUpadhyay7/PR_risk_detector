import type { Request, Response, NextFunction } from "express";
import { AppError, isAppError } from "../utils/AppError.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isAppError(err)) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected error occurred. Please try again." });
}
