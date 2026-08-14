import { randomBytes } from "node:crypto";
import { clearAuthCookie, exchangeGitHubCode, findOrCreateUser, getGitHubAuthUrl, setAuthCookie, signToken, } from "../services/auth/auth.service.js";
import { AppError } from "../utils/AppError.js";
const oauthStates = new Set();
export function startGitHubAuth(_req, res) {
    const state = randomBytes(16).toString("hex");
    oauthStates.add(state);
    res.redirect(getGitHubAuthUrl(state));
}
export async function handleGitHubCallback(req, res, next) {
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
        const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
        res.redirect(`${frontendUrl}/dashboard`);
    }
    catch (error) {
        next(error);
    }
}
export async function getCurrentUser(req, res) {
    res.json({ user: req.user ?? null });
}
export function logout(_req, res) {
    clearAuthCookie(res);
    res.json({ success: true });
}
//# sourceMappingURL=auth.controller.js.map