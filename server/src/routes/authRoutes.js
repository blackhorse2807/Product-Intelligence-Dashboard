import { Router } from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", authenticate, getMe);

export default router;
