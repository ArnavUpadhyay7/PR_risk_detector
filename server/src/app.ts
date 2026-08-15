import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

function getAllowedOrigin(): string {
  try {
    const raw = process.env.FRONTEND_URL ?? "http://localhost:5173";
    return new URL(raw).origin;
  } catch {
    return "http://localhost:5173";
  }
}

export function createApp() {
  const app = express();
  const frontendOrigin = getAllowedOrigin();

  app.use(
    cors({
      origin: frontendOrigin,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  app.use("/api", apiRoutes);

  app.use(errorHandler);

  return app;
}
