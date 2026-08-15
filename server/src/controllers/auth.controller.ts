import type { Request, Response, NextFunction } from "express";
import { randomBytes } from "node:crypto";
import {
  clearAuthCookie,
  exchangeGitHubCode,
  findOrCreateUser,
  getFrontendUrl,
  getGitHubAuthUrl,
  isCrossDomainAuth,
  setAuthCookie,
  signToken,
} from "../services/auth/auth.service.js";
import { AppError } from "../utils/AppError.js";

const oauthStates = new Set<string>();

export function startGitHubAuth(_req: Request, res: Response): void {
  const state = randomBytes(16).toString("hex");
  oauthStates.add(state);
  res.redirect(getGitHubAuthUrl(state));
}

export async function handleGitHubCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const code = req.query.code;
    const state = req.query.state;

    if (typeof code !== "string" || typeof state !== "string" || !oauthStates.has(state)) {
      throw new AppError("Invalid OAuth callback.", 400);
    }

    oauthStates.delete(state);

    const githubUser = await exchangeGitHubCode(code);
    const user = await findOrCreateUser(githubUser);
    const token = signToken({ userId: user.id, githubId: user.githubId });
    setAuthCookie(res, token);

    const frontendUrl = getFrontendUrl();
    const redirectUrl = isCrossDomainAuth()
      ? `${frontendUrl}/dashboard#prd_session=${encodeURIComponent(token)}`
      : `${frontendUrl}/dashboard`;
    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user ?? null });
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookie(res);
  res.json({ success: true });
}
