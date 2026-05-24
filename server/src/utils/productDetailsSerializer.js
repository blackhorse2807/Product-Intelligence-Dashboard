import { getFrameImageUrl } from "../services/cloudinaryService.js";
import { buildCatalogFieldRows, getMissingCatalogFields } from "./missingFields.js";
import { getMissingTitleEssentialFields } from "./titleEssentials.js";
import { TITLE_ESSENTIAL_FIELDS } from "../constants/titleRequiredFields.js";
import { hasProductPricing } from "./productPricing.js";

function parseTimestampToSeconds(timestamp) {
  if (!timestamp) return 0;
  const parts = String(timestamp).split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(parts[0]) || 0;
}

function buildFrames(product, attrs, ai) {
  const timestamps = attrs.frameTimestamps || [];
  const duration = attrs.duration || 0;

  let frameList = timestamps.map((timestamp, index) => {
    const frameNumber = index + 1;
    const insight = ai.frameInsights?.find((f) => f.frameNumber === frameNumber);
    const seconds = parseTimestampToSeconds(timestamp);

    return {
      frameNumber,
      timestamp,
      imageUrl: product.videoPublicId
        ? getFrameImageUrl(product.videoPublicId, seconds)
        : "",
    };
  });

  if (!frameList.length && product.videoPublicId && duration > 0) {
    frameList = [0.2, 0.5, 0.8].map((ratio, index) => {
      const seconds = Number((duration * ratio).toFixed(2));
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const timestamp = [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");

      return {
        frameNumber: index + 1,
        timestamp,
        imageUrl: getFrameImageUrl(product.videoPublicId, seconds),
      };
    });
  }

  return frameList;
}

export function serializeProductDetails(product, {
  issues,
  validation,
  competitorPrices,
  competitorPricing,
  alerts,
}) {
  const attrs = product.extractedAttributes || {};
  const ai = attrs.aiAnalysis || {};
  const filledFields = attrs.filledFields || [];
  const catalogFields = buildCatalogFieldRows(product, filledFields);
  const missingFields = getMissingCatalogFields(product, filledFields);
  const titleEssentialMissing = getMissingTitleEssentialFields(product);
  const titleMissing = titleEssentialMissing.some((m) => m.dbKey === "title");

  return {
    product,
    catalogFields,
    missingFields,
    titleEssentialFields: TITLE_ESSENTIAL_FIELDS,
    titleEssentialMissing,
    needsCompletion: missingFields.length > 0 || titleEssentialMissing.length > 0,
    titleMissing,
    validation: validation
      ? {
          qualityScore: validation.qualityScore,
          descriptionQuality: validation.descriptionQuality,
          titleValidation: validation.titleValidation,
          issues: validation.issues || issues || [],
        }
      : {
          qualityScore: product.qualityScore,
          descriptionQuality: attrs.descriptionQuality,
          issues: issues || [],
        },
    extraction: {
      videoUrl: product.videoUrl,
      ocrText: attrs.ocrCombinedText || ai.ocrSummary || "",
      ocrConfidence: attrs.ocrConfidence ?? 0,
      frames: buildFrames(product, attrs, ai),
    },
    titleSource: {
      active: product.activeTitleSource || "original",
      hasEnhanced: Boolean(product.enhancedTitle),
      currentTitle: product.title,
      originalTitle:
        attrs.titleEnhancement?.originalTitle || attrs.savedOriginalTitle || product.title,
      enhancedTitle: product.enhancedTitle || "",
    },
    enhancedTitle:
      attrs.titleEnhancement ||
      (product.enhancedTitle
        ? {
            originalTitle:
              attrs.titleEnhancement?.originalTitle || attrs.savedOriginalTitle || product.title,
            enhancedTitle: product.enhancedTitle,
            keywords: product.suggestedKeywords || [],
            reason: "",
            usedAttributes: attrs.titleEnhancement?.usedAttributes || [],
            skippedAttributes: attrs.titleEnhancement?.skippedAttributes || [],
            titleValidation: attrs.titleEnhancement?.titleValidation,
          }
        : null),
    manualFieldsSaved: Boolean(attrs.manualFieldsSaved),
    hasPricing: hasProductPricing(product),
    issues,
    alerts,
    competitorPrices,
    competitorPricing: competitorPricing || null,
  };
}
