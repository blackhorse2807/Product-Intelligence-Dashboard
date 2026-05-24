import { extractCatalogFieldsFromOcr } from "./catalogFieldExtraction.js";
import { CATALOG_FIELDS } from "../constants/catalogFields.js";
import { getMissingCatalogFields } from "./missingFields.js";

/**
 * Build product document from OCR pipeline — no fake placeholder prices/brands.
 */
export function buildProductFromVideoAnalysis({
  originalName,
  format,
  duration,
  videoUrl,
  frames,
  ocrOutput,
  aiAnalysis,
  jobId,
}) {
  const { fields, filledFields } = extractCatalogFieldsFromOcr({
    ocrOutput,
    aiAnalysis,
    originalName,
  });

  const draft = {
    skuId: fields.skuId || `PENDING-${jobId || Date.now()}`,
    title: fields.title || "Pending Review",
    description: fields.description || "",
    brand: fields.brand || "",
    category: fields.category || "",
    price: fields.price || 0,
    mrp: fields.mrp || 0,
    availability: fields.availability || "",
    color: fields.color || "",
    size: fields.size || "",
    material: fields.material || "",
  };

  const missingFields = getMissingCatalogFields(draft, filledFields);
  const ocrText = ocrOutput?.combinedText || "";
  const totalFields = CATALOG_FIELDS.length;

  return {
    ...draft,
    extractedAttributes: {
      source: "video_frame_pipeline",
      originalFilename: originalName,
      videoUrl,
      duration,
      format,
      frameCount: frames?.length || 0,
      frameTimestamps: frames?.map((f) => f.timestamp) || [],
      ocrCombinedText: ocrText,
      ocrConfidence: ocrOutput?.overallConfidence,
      ocrPartial: ocrOutput?.partial,
      filledFields,
      missingFields: missingFields.map((m) => m.key),
      aiAnalysis,
    },
    suggestedKeywords: [],
    qualityScore: Math.max(
      0,
      Math.min(100, Math.round((filledFields.length / totalFields) * 100))
    ),
    _missingFields: missingFields,
  };
}
