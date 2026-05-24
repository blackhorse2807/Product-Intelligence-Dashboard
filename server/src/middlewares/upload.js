import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary, { assertCloudinaryConfigured } from "../config/cloudinary.js";
import env from "../config/env.js";

const VIDEO_MIMES = ["video/mp4", "video/quicktime", "video/x-msvideo"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi"];
const CSV_MIMES = ["text/csv", "application/vnd.ms-excel", "text/plain"];

const sizeLimit = { fileSize: env.maxFileSizeMb * 1024 * 1024 };

function videoFileFilter(_req, file, cb) {
  const ext = file.originalname?.toLowerCase().slice(file.originalname.lastIndexOf("."));
  const validMime = VIDEO_MIMES.includes(file.mimetype);
  const validExt = VIDEO_EXTENSIONS.includes(ext);

  if (validMime || validExt) {
    cb(null, true);
    return;
  }
  cb(new Error("Invalid file type. Allowed videos: mp4, mov, avi"), false);
}

function csvFileFilter(_req, file, cb) {
  const isCsvMime = CSV_MIMES.includes(file.mimetype);
  const isCsvExt = file.originalname?.toLowerCase().endsWith(".csv");

  if (isCsvMime || isCsvExt) {
    cb(null, true);
    return;
  }
  cb(new Error("Invalid file type. Only CSV files are allowed"), false);
}

export { csvFileFilter };

function createVideoStorage() {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: env.cloudinary.videoFolder,
      resource_type: "video",
      allowed_formats: ["mp4", "mov", "avi"],
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    },
  });
}

function createCsvStorage() {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: env.cloudinary.csvFolder,
      resource_type: "raw",
      format: "csv",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    },
  });
}

let videoUploadMiddleware;
let csvUploadMiddleware;

function getVideoUpload() {
  if (!videoUploadMiddleware) {
    videoUploadMiddleware = multer({
      storage: createVideoStorage(),
      fileFilter: videoFileFilter,
      limits: sizeLimit,
    }).single("video");
  }
  return videoUploadMiddleware;
}

function getCsvUpload() {
  if (!csvUploadMiddleware) {
    csvUploadMiddleware = multer({
      storage: createCsvStorage(),
      fileFilter: csvFileFilter,
      limits: sizeLimit,
    }).single("csv");
  }
  return csvUploadMiddleware;
}

export function runUpload(getMiddleware) {
  return (req, res, next) => {
    try {
      assertCloudinaryConfigured();
    } catch (err) {
      return next(err);
    }

    getMiddleware()(req, res, (err) => {
      if (!err) return next();

      if (err.code === "LIMIT_FILE_SIZE") {
        err.statusCode = 413;
        err.message = `File exceeds ${env.maxFileSizeMb}MB limit`;
      } else if (!err.statusCode) {
        err.statusCode = 400;
      }
      next(err);
    });
  };
}

export const uploadVideo = runUpload(getVideoUpload);
export const uploadCsv = runUpload(getCsvUpload);
