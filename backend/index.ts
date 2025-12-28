import express from "express";
import { healthCheck } from "./src/controllers/health.controller";
import authRoutes from "./src/routes/auth.routes";
import { requireAuth } from "./src/middleware/auth.middleware";


const router = express.Router();
const app = express();

app.use(express.json());

router.get("/health", healthCheck);
app.use("/auth", authRoutes);

app.get("/", requireAuth, (req, res) => {
    res.status(200).json({
    message: "Authenticated user",
    user: req.user
  });
})

app.use(router);

app.listen(5003, () => {
    console.log("Server started on port 5003");
})

export default app;