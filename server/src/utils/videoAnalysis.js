/**
 * AI vision analysis — uses OCR output for structured product insights.
 * Replace with OpenAI Vision / Gemini in production.
 */
export async function runAiAnalysis({ frames, ocrOutput, originalName, duration }) {
  console.log(`[ai] Running AI vision analysis...`);

  const combinedText = ocrOutput?.combinedText || "";

  const analysis = {
    detectedLabels: ["product", "packaging"],
    dominantColors: [],
    suggestedCategory: /shirt|tee|dress|apparel/i.test(combinedText + originalName)
      ? "Apparel"
      : /phone|laptop|headphone|electronic|usb|charger/i.test(combinedText + originalName)
        ? "Electronics"
        : "General",
    suggestedBrand: ocrOutput?.detectedBrands?.[0] || null,
    packagingKeywords: ocrOutput?.packagingKeywords || [],
    frameInsights: frames.map((f) => {
      const ocrFrame = ocrOutput?.frames?.find((r) => r.frameNumber === f.frameNumber);
      return {
        frameNumber: f.frameNumber,
        timestamp: f.timestamp,
        ocrSnippet: ocrFrame?.extractedText?.slice(0, 120) || "",
        confidence: ocrFrame?.confidence || 0,
      };
    }),
    ocrSummary: combinedText,
    ocrConfidence: ocrOutput?.overallConfidence || 0,
    confidence: Math.min(0.95, (ocrOutput?.overallConfidence || 50) / 100),
  };

  console.log(`[ai] AI analysis completed — category: ${analysis.suggestedCategory}`);
  return analysis;
}
