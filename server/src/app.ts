import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api", apiRoutes);

  app.use(errorHandler);

  return app;
}
