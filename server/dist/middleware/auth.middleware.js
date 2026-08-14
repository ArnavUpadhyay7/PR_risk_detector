import { getAuthCookieName, getUserById, verifyToken, } from "../services/auth/auth.service.js";
import { AppError } from "../utils/AppError.js";
export async function requireAuth(req, _res, next) {
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
    }
    catch (error) {
        next(error);
    }
}
export async function optionalAuth(req, _res, next) {
    try {
        const token = req.cookies?.[getAuthCookieName()];
        if (token) {
            const payload = verifyToken(token);
            const user = await getUserById(payload.userId);
            if (user)
                req.user = user;
        }
        next();
    }
    catch {
        next();
    }
}
//# sourceMappingURL=auth.middleware.js.map