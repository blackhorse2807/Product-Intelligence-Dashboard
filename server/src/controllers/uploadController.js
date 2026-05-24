import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { JOB_STATUS, JOB_TYPES } from "../utils/enums.js";
import { Job } from "../models/Job.js";
import { parseCloudinaryFile } from "../services/cloudinaryService.js";
import { enqueueJob } from "../services/jobService.js";
import { ingestProductsCsv } from "../services/csvProcessingService.js";

export const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    const err = new Error("Video file is required");
    err.statusCode = 400;
    throw err;
  }

  const media = parseCloudinaryFile(req.file);

  if (!media.url || !media.publicId) {
    const err = new Error("Cloudinary upload did not return URL or public ID");
    err.statusCode = 500;
    throw err;
  }

  const job = await Job.create({
    type: JOB_TYPES.VIDEO_EXTRACTION,
    status: JOB_STATUS.PENDING,
    progress: 0,
    metadata: {
      videoUrl: media.url,
      videoPublicId: media.publicId,
      originalName: media.originalName,
      mimeType: media.mimeType,
      format: media.format,
      duration: media.duration,
      bytes: media.bytes,
      userId: req.user?._id,
    },
  });

  enqueueJob(job._id);

  return successResponse(
    res,
    {
      jobId: job._id,
      videoUrl: media.url,
      videoPublicId: media.publicId,
    },
    "Video uploaded to Cloudinary. Processing job queued.",
    202
  );
});

export const uploadProductsCsv = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    const err = new Error("CSV file is required (field: csvFile)");
    err.statusCode = 400;
    throw err;
  }

  const result = await ingestProductsCsv(req.file.buffer, req.user?._id);

  if (!result.success) {
    return errorResponse(res, "CSV is missing required headers", 400, {
      missingHeaders: result.missingHeaders,
    });
  }

  const { summary } = result;
  const message =
    summary.invalidRows === 0
      ? `Imported ${summary.validRows} product(s) successfully.`
      : `Imported ${summary.validRows} of ${summary.totalRows} product(s). ${summary.invalidRows} row(s) failed validation.`;

  return successResponse(
    res,
    {
      summary,
      rows: result.rows,
    },
    message,
    summary.validRows > 0 ? 201 : 200
  );
});
