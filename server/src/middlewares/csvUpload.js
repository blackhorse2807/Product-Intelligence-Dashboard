import env from "../config/env.js";
import multer from "multer";
import { csvFileFilter } from "./upload.js";

const sizeLimit = { fileSize: env.maxFileSizeMb * 1024 * 1024 };

/**
 * In-memory CSV upload for synchronous parsing (field: csvFile).
 */
export const uploadCsvFile = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFileFilter,
  limits: sizeLimit,
}).single("csvFile");

export function handleCsvUpload(req, res, next) {
  uploadCsvFile(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      err.statusCode = 413;
      err.message = `CSV exceeds ${env.maxFileSizeMb}MB limit`;
    } else if (!err.statusCode) {
      err.statusCode = 400;
    }
    next(err);
  });
}
