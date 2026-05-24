import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
  uploadProfileAvatar,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import { uploadAvatar } from "../middlewares/upload.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);

router.get("/auth/me", authenticate, getMe);
router.patch("/auth/profile", authenticate, updateProfile);
router.post("/auth/profile/avatar", authenticate, uploadAvatar, uploadProfileAvatar);

export default router;
