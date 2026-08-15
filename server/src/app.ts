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
  app.set("trust proxy", 1);
  const frontendOrigin = getAllowedOrigin();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origin === frontendOrigin) {
          callback(null, origin ?? frontendOrigin);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  app.use("/api", apiRoutes);

  app.use(errorHandler);

  return app;
}
