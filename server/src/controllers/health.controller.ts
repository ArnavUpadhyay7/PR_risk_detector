import type { Request, Response } from "express";
import type { HealthResponse } from "../types/api.types.js";

export function getHealth(_req: Request, res: Response): void {
  const response: HealthResponse = { status: "ok" };
  res.json(response);
}
