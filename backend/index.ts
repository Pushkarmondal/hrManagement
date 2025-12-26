import express from "express";
import { healthCheck } from "./src/controllers/health.controller";

const router = express.Router();
const app = express();

router.get("/health", healthCheck);

app.listen(3000, () => {
    console.log("Server started on port 3000");
})

export default app;