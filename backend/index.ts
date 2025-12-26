import express from "express";
import { healthCheck } from "./src/controllers/health.controller";

const router = express.Router();
const app = express();

router.get("/health", healthCheck);
app.use(router);

app.listen(5003, () => {
    console.log("Server started on port 5003");
})

export default app;