import { Router } from "express";
import { analyzePr } from "../controllers/pr.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
const router = Router();
router.post("/analyze", requireAuth, analyzePr);
export default router;
//# sourceMappingURL=pr.routes.js.map