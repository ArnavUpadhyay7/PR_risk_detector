import { Router } from "express";
import {
  compareAnalysisPair,
  getAnalyses,
  getAnalysis,
  getAnalysisHistory,
  getRepos,
} from "../controllers/analyses.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/repositories", getRepos);
router.get("/", getAnalyses);
router.get("/compare/:id1/:id2", compareAnalysisPair);
router.get("/:id/history", getAnalysisHistory);
router.get("/:id", getAnalysis);

export default router;
