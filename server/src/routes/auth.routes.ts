import { Router } from "express";
import {
  getCurrentUser,
  handleGitHubCallback,
  logout,
  startGitHubAuth,
} from "../controllers/auth.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/github", startGitHubAuth);
router.get("/github/callback", handleGitHubCallback);
router.get("/me", optionalAuth, getCurrentUser);
router.post("/logout", logout);

export default router;
