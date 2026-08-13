export class AppError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
    }
}
export function isAppError(error) {
    return error instanceof AppError;
}
//# sourceMappingURL=AppError.js.map