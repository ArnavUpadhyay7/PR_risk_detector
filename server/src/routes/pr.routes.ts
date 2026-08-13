import { Router } from "express";
import { analyzePr } from "../controllers/pr.controller.js";

const router = Router();

router.post("/analyze", analyzePr);

export default router;
