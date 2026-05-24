import { Job } from "../models/Job.js";
import { Product } from "../models/Product.js";
import { ProductIssue } from "../models/ProductIssue.js";
import { JOB_STATUS, JOB_TYPES } from "../utils/enums.js";
import { buildProductFromVideoAnalysis } from "../utils/mediaExtraction.js";
import { runAiAnalysis } from "../utils/videoAnalysis.js";
import { extractFramesFromVideoDetailed } from "../services/frameExtractionService.js";
import { extractTextFromFrames } from "../services/ocrService.js";
import { validateExtractedProduct } from "../services/validationService.js";
import { generateAlertsFromValidation } from "../services/alertGenerationService.js";
import { cleanupJobTemp } from "../utils/tempFileUtils.js";

async function updateJob(jobId, patch) {
  return Job.findByIdAndUpdate(jobId, patch, { new: true });
}

async function saveValidationIssues(productId, validation) {
  if (!validation?.issues?.length) return [];

  return ProductIssue.insertMany(
    validation.issues.map((issue) => ({
      productId,
      severity: issue.severity,
      type: issue.type,
      message: issue.message,
      suggestedFix: issue.suggestedFix || "",
    }))
  );
}

async function processVideoExtractionJob(job) {
  const { videoUrl, videoPublicId, originalName, format } = job.metadata || {};
  const jobId = String(job._id);

  if (!videoUrl || !videoPublicId) {
    throw new Error("Job missing Cloudinary video references");
  }

  // 10% — upload received, job running
  await updateJob(job._id, { status: JOB_STATUS.RUNNING, progress: 10, startedAt: new Date() });

  try {
    // 30% — frame extraction
    await updateJob(job._id, { progress: 30 });
    const extractionResult = await extractFramesFromVideoDetailed(videoUrl, { jobId });
    const { frames, duration } = extractionResult;

    await updateJob(job._id, {
      progress: 30,
      metadata: {
        ...job.metadata,
        extractedFrameCount: frames.length,
        videoDurationSec: duration,
      },
    });

    // 45% — OCR processing
    await updateJob(job._id, { progress: 45 });
    const ocrOutput = await extractTextFromFrames(frames);

    await updateJob(job._id, {
      progress: 45,
      metadata: {
        ...job.metadata,
        ocrConfidence: ocrOutput.overallConfidence,
        ocrPartial: ocrOutput.partial,
      },
    });

    // 60% — AI vision analysis
    await updateJob(job._id, { progress: 60 });
    const aiAnalysis = await runAiAnalysis({
      frames,
      ocrOutput,
      originalName,
      duration,
    });

    // 75% — structured product extraction + validation
    await updateJob(job._id, { progress: 75 });
    const extracted = buildProductFromVideoAnalysis({
      originalName,
      format,
      duration,
      videoUrl,
      jobId,
      frames: frames.map(({ frameNumber, timestamp, percentage }) => ({
        frameNumber,
        timestamp,
        percentage,
      })),
      ocrOutput,
      aiAnalysis,
    });

    const validation = await validateExtractedProduct(extracted, ocrOutput);
    extracted.qualityScore = validation.qualityScore;
    extracted.extractedAttributes = {
      ...extracted.extractedAttributes,
      descriptionQuality: validation.descriptionQuality,
      validationSummary: {
        qualityScore: validation.qualityScore,
        issueCount: validation.issues.length,
      },
    };

    const { _missingFields, ...productData } = extracted;

    const product = await Product.create({
      ...productData,
      videoUrl,
      videoPublicId,
      imagePublicId: videoPublicId,
      enhancedTitle: "",
    });

    await saveValidationIssues(product._id, validation);

    // 90% — alerts
    await updateJob(job._id, { progress: 90 });
    await generateAlertsFromValidation(product._id, validation);

    // 100% — completed
    await updateJob(job._id, {
      status: JOB_STATUS.COMPLETED,
      progress: 100,
      completedAt: new Date(),
      metadata: {
        ...job.metadata,
        extractedFrameCount: frames.length,
        videoDurationSec: duration,
        ocrConfidence: ocrOutput.overallConfidence,
        ocrPartial: ocrOutput.partial,
        productId: product._id,
        missingFieldCount: _missingFields?.length ?? 0,
        pipeline: "upload_frames_ocr_ai_validation_alerts",
      },
    });

    return product;
  } finally {
    await cleanupJobTemp(jobId);
  }
}

async function processCsvImportJob(job) {
  const { csvUrl, csvPublicId, originalName } = job.metadata || {};

  await updateJob(job._id, { status: JOB_STATUS.RUNNING, progress: 25, startedAt: new Date() });

  await new Promise((r) => setTimeout(r, 1000));

  const product = await Product.create({
    skuId: `SKU-CSV-${Date.now()}`,
    title: `Imported from ${originalName || "catalog.csv"}`,
    description: "Product imported via CSV fallback (simulated).",
    brand: "CSV Import",
    category: "General",
    price: 499,
    mrp: 799,
    imagePublicId: "",
    videoUrl: "",
    videoPublicId: "",
    availability: "in_stock",
    extractedAttributes: { source: "csv_simulation", csvUrl, csvPublicId },
    suggestedKeywords: ["imported", "csv"],
    qualityScore: 55,
  });

  await updateJob(job._id, {
    status: JOB_STATUS.COMPLETED,
    progress: 100,
    completedAt: new Date(),
    metadata: { ...job.metadata, productId: product._id },
  });

  return product;
}

export async function processJob(jobId) {
  const job = await Job.findById(jobId);
  if (!job) throw new Error("Job not found");

  if (job.status === JOB_STATUS.COMPLETED) return job;

  try {
    switch (job.type) {
      case JOB_TYPES.VIDEO_EXTRACTION:
        return await processVideoExtractionJob(job);
      case JOB_TYPES.CSV_IMPORT:
        return await processCsvImportJob(job);
      default:
        await updateJob(job._id, {
          status: JOB_STATUS.FAILED,
          errorMessage: `Unsupported job type: ${job.type}`,
          completedAt: new Date(),
        });
    }
  } catch (err) {
    await updateJob(job._id, {
      status: JOB_STATUS.FAILED,
      errorMessage: err.message,
      completedAt: new Date(),
    });
    throw err;
  }
}
