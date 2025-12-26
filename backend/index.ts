import express from "express";
import { healthCheck } from "./src/controllers/health.controller";

const router = express.Router();

router.get("/health", healthCheck);

export default router;