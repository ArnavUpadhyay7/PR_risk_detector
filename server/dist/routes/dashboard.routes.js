import { Router } from "express";
import { getStats } from "../controllers/analyses.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
const router = Router();
router.get("/stats", requireAuth, getStats);
export default router;
//# sourceMappingURL=dashboard.routes.js.map