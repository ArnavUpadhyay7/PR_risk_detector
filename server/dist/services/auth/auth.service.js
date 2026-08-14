import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
const COOKIE_NAME = "prd_token";
const TOKEN_TTL = "7d";
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new AppError("Authentication is not configured. Set JWT_SECRET.", 503);
    }
    return secret;
}
function getGitHubConfig() {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new AppError("GitHub OAuth is not configured.", 503);
    }
    return { clientId, clientSecret };
}
export function signToken(payload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_TTL });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, getJwtSecret());
    }
    catch {
        throw new AppError("Invalid or expired session. Please sign in again.", 401);
    }
}
export function setAuthCookie(res, token) {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
    });
}
export function clearAuthCookie(res) {
    res.clearCookie(COOKIE_NAME, { path: "/" });
}
export function getAuthCookieName() {
    return COOKIE_NAME;
}
export function getGitHubAuthUrl(state) {
    const { clientId } = getGitHubConfig();
    const redirectUri = `${process.env.APP_URL ?? "http://localhost:5000"}/api/auth/github/callback`;
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "read:user user:email",
        state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}
export async function exchangeGitHubCode(code) {
    const { clientId, clientSecret } = getGitHubConfig();
    const redirectUri = `${process.env.APP_URL ?? "http://localhost:5000"}/api/auth/github/callback`;
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
    const tokenData = (await tokenResponse.json());
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
    return userResponse.json();
}
export async function findOrCreateUser(githubUser) {
    const githubId = String(githubUser.id);
    let user = await UserModel.findOne({ githubId });
    if (!user) {
        user = await UserModel.create({
            githubId,
            username: githubUser.login,
            avatarUrl: githubUser.avatar_url,
            email: githubUser.email ?? undefined,
        });
    }
    else {
        user.username = githubUser.login;
        user.avatarUrl = githubUser.avatar_url;
        if (githubUser.email)
            user.email = githubUser.email;
        await user.save();
    }
    return {
        id: user._id.toString(),
        githubId: user.githubId,
        username: user.username,
        avatarUrl: user.avatarUrl,
        email: user.email ?? undefined,
    };
}
export async function getUserById(userId) {
    const user = await UserModel.findById(userId);
    if (!user)
        return null;
    return {
        id: user._id.toString(),
        githubId: user.githubId,
        username: user.username,
        avatarUrl: user.avatarUrl,
        email: user.email ?? undefined,
    };
}
//# sourceMappingURL=auth.service.js.map