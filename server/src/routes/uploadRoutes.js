import { Router } from "express";
import { uploadVideo, uploadProductsCsv } from "../controllers/uploadController.js";
import { uploadVideo as videoMiddleware } from "../middlewares/upload.js";
import { handleCsvUpload } from "../middlewares/csvUpload.js";

const router = Router();

router.post("/upload-video", videoMiddleware, uploadVideo);
router.post("/upload-products-csv", handleCsvUpload, uploadProductsCsv);

export default router;
