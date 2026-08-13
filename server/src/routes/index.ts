import { Router } from "express";
import healthRoutes from "./health.routes.js";
import prRoutes from "./pr.routes.js";

const router = Router();

router.use(healthRoutes);
router.use("/pr", prRoutes);

export default router;
