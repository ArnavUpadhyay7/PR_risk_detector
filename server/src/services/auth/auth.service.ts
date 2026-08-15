import jwt from "jsonwebtoken";
import type { Response } from "express";
import { UserModel } from "../../models/user.model.js";
import type { AuthUser, JwtPayload } from "../../types/auth.types.js";
import { AppError } from "../../utils/AppError.js";

const COOKIE_NAME = "prd_token";
const TOKEN_TTL = "7d";

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  email: string | null;
}

interface GitHubTokenResponse {
  access_token: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("Authentication is not configured. Set JWT_SECRET.", 503);
  }
  return secret;
}

function getAppUrl(): string {
  const raw = process.env.APP_URL ?? "http://localhost:5000";
  return raw.replace(/\/+$/, "");
}

function getFrontendUrl(): string {
  const raw = process.env.FRONTEND_URL ?? "http://localhost:5173";
  return raw.replace(/\/+$/, "");
}

function isCrossDomainAuth(): boolean {
  try {
    const frontend = new URL(getFrontendUrl());
    const app = new URL(getAppUrl());
    if (frontend.origin === app.origin) return false;
    // localhost uses different ports locally but shares cookies on the host.
    if (frontend.hostname === "localhost" && app.hostname === "localhost") return false;
    return true;
  } catch {
    return false;
  }
}

function getCookieOptions(): { secure: boolean; sameSite: "lax" | "none" } {
  if (isCrossDomainAuth()) {
    return { secure: true, sameSite: "none" };
  }
  return {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
}

function getGitHubRedirectUri(): string {
  return `${getAppUrl()}/api/auth/github/callback`;
}

function getGitHubConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new AppError("GitHub OAuth is not configured.", 503);
  }
  return { clientId, clientSecret };
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    throw new AppError("Invalid or expired session. Please sign in again.", 401);
  }
}

export function setAuthCookie(res: Response, token: string): void {
  const cookieOptions = getCookieOptions();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  const cookieOptions = getCookieOptions();
  res.clearCookie(COOKIE_NAME, {
    path: "/",
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
  });
}

export function getAuthCookieName(): string {
  return COOKIE_NAME;
}

export function getGitHubAuthUrl(state: string): string {
  const { clientId } = getGitHubConfig();
  const redirectUri = getGitHubRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeGitHubCode(code: string): Promise<GitHubUser> {
  const { clientId, clientSecret } = getGitHubConfig();
  const redirectUri = getGitHubRedirectUri();

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new AppError("Failed to authenticate with GitHub.", 502);
  }

  const tokenData = (await tokenResponse.json()) as GitHubTokenResponse & { error?: string };
  if (!tokenData.access_token) {
    throw new AppError("GitHub authentication was denied or failed.", 401);
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "PR-Risk-Detector",
    },
  });

  if (!userResponse.ok) {
    throw new AppError("Failed to fetch GitHub user profile.", 502);
  }

  return userResponse.json() as Promise<GitHubUser>;
}

export async function findOrCreateUser(githubUser: GitHubUser): Promise<AuthUser> {
  const githubId = String(githubUser.id);

  let user = await UserModel.findOne({ githubId });
  if (!user) {
    user = await UserModel.create({
      githubId,
      username: githubUser.login,
      avatarUrl: githubUser.avatar_url,
      ...(githubUser.email ? { email: githubUser.email } : {}),
    });
  } else {
    user.username = githubUser.login;
    user.avatarUrl = githubUser.avatar_url;
    if (githubUser.email) user.email = githubUser.email;
    await user.save();
  }

  return {
    id: user._id.toString(),
    githubId: user.githubId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    ...(user.email ? { email: user.email } : {}),
  };
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = await UserModel.findById(userId);
  if (!user) return null;

  return {
    id: user._id.toString(),
    githubId: user.githubId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    ...(user.email ? { email: user.email } : {}),
  };
}
