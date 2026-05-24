import { errorResponse } from "../utils/apiResponse.js";

export const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, _next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return errorResponse(res, "Validation failed", 400, err.errors);
  }

  if (err.name === "CastError") {
    return errorResponse(res, "Invalid resource ID", 400);
  }

  if (err.code === "LIMIT_FILE_SIZE" || err.statusCode === 413) {
    return errorResponse(res, err.message || "File too large", 413);
  }

  if (err.message?.includes("Invalid file type") || err.message?.includes("Only")) {
    return errorResponse(res, err.message, 400);
  }

  if (err.message?.includes("Required for product title")) {
    return errorResponse(res, err.message, 400, err.missingTitleFields);
  }

  if (err.http_code || err.name === "CloudinaryError") {
    return errorResponse(res, err.message || "Cloudinary upload failed", err.http_code || 502);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return errorResponse(res, message, statusCode);
};
