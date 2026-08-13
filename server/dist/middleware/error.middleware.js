import { AppError, isAppError } from "../utils/AppError.js";
export function errorHandler(err, _req, res, _next) {
    if (isAppError(err)) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
}
//# sourceMappingURL=error.middleware.js.map