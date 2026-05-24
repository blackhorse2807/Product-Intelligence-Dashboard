import { Router } from "express";
import { getJobs, getJobById } from "../controllers/jobController.js";

const router = Router();

router.get("/jobs", getJobs);
router.get("/jobs/:id", getJobById);

export default router;
