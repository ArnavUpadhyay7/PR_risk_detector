import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import prRoutes from "./pr.routes.js";
import analysesRoutes from "./analyses.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
const router = Router();
router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/analyses", analysesRoutes);
router.use("/pr", prRoutes);
export default router;
//# sourceMappingURL=index.js.map