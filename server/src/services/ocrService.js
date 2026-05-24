import fs from "fs-extra";
import { createWorker } from "tesseract.js";
import {
  cleanOcrText,
  deduplicateWords,
  detectBrandNames,
  detectPackagingKeywords,
  mergeFrameTexts,
} from "../utils/ocrTextUtils.js";

const OCR_LANG = "eng";
const FRAME_TIMEOUT_MS = 60_000;

let sharedWorker = null;

async function getWorker() {
  if (!sharedWorker) {
    sharedWorker = await createWorker(OCR_LANG);
  }
  return sharedWorker;
}

async function terminateWorker() {
  if (sharedWorker) {
    await sharedWorker.terminate();
    sharedWorker = null;
  }
}

function recognizeWithTimeout(worker, imagePath) {
  return Promise.race([
    worker.recognize(imagePath),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("OCR timed out for frame")), FRAME_TIMEOUT_MS)
    ),
  ]);
}

/**
 * Run Tesseract OCR on extracted frame images.
 *
 * @param {Array<{ frameNumber, timestamp, path }>} frames
 * @returns {Promise<{ combinedText, frames, overallConfidence, partial, detectedBrands, packagingKeywords }>}
 */
export async function extractTextFromFrames(frames) {
  if (!frames?.length) {
    throw new Error("No frames provided for OCR");
  }

  console.log(`[ocr] OCR started — ${frames.length} frame(s)`);

  const worker = await getWorker();
  const results = [];
  let partial = false;

  try {
    for (const frame of frames) {
      console.log(`[ocr] Processing frame ${frame.frameNumber} @ ${frame.timestamp}`);

      if (!frame.path || !(await fs.pathExists(frame.path))) {
        console.warn(`[ocr] Frame file missing: frame ${frame.frameNumber}`);
        partial = true;
        results.push({
          frameNumber: frame.frameNumber,
          timestamp: frame.timestamp,
          extractedText: "",
          confidence: 0,
          error: "Frame file not found",
        });
        continue;
      }

      try {
        const { data } = await recognizeWithTimeout(worker, frame.path);
        const cleaned = deduplicateWords(cleanOcrText(data.text || ""));
        const confidence = Math.round(data.confidence || 0);

        console.log(
          `[ocr] Frame ${frame.frameNumber} confidence: ${confidence}% — text: "${cleaned.slice(0, 80)}${cleaned.length > 80 ? "..." : ""}"`
        );

        results.push({
          frameNumber: frame.frameNumber,
          timestamp: frame.timestamp,
          extractedText: cleaned,
          confidence,
        });
      } catch (err) {
        console.warn(`[ocr] Frame ${frame.frameNumber} failed: ${err.message}`);
        partial = true;
        results.push({
          frameNumber: frame.frameNumber,
          timestamp: frame.timestamp,
          extractedText: "",
          confidence: 0,
          error: err.message,
        });
      }
    }
  } finally {
    await terminateWorker();
  }

  const successful = results.filter((r) => r.extractedText);
  const combinedText = deduplicateWords(
    mergeFrameTexts(successful.map((r) => r.extractedText))
  );

  const overallConfidence =
    successful.length > 0
      ? Math.round(
          successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length
        )
      : 0;

  const detectedBrands = detectBrandNames(combinedText);
  const packagingKeywords = detectPackagingKeywords(combinedText);

  console.log(`[ocr] OCR completed — overall confidence: ${overallConfidence}%`);
  if (detectedBrands.length) {
    console.log(`[ocr] Detected brands: ${detectedBrands.join(", ")}`);
  }

  return {
    combinedText,
    frames: results,
    overallConfidence,
    partial,
    detectedBrands,
    packagingKeywords,
  };
}
