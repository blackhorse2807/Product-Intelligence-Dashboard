/**
 * Extract catalog fields from OCR text — only set values we can infer.
 */
export function extractCatalogFieldsFromOcr({ ocrOutput, aiAnalysis, originalName }) {
  const text = (ocrOutput?.combinedText || "").trim();
  const filledFields = [];
  const fields = {};

  const skuMatch =
    text.match(/SKU[-\s]?([A-Z0-9]+)/i) || (originalName || "").match(/SKU[-\s]?([A-Z0-9]+)/i);
  if (skuMatch) {
    fields.skuId = `SKU-${skuMatch[1].toUpperCase()}`;
    filledFields.push("skuId");
  }

  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 3);
  const titleLine = lines.find((l) => l.length > 8 && !/^SKU/i.test(l) && !/^https?:/i.test(l));
  const baseName = (originalName || "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();

  if (titleLine) {
    fields.title = titleLine.slice(0, 120);
    filledFields.push("title");
  } else if (baseName.length > 3 && !/^video/i.test(baseName)) {
    fields.title = baseName.replace(/\b\w/g, (c) => c.toUpperCase());
    filledFields.push("title");
  }

  if (text.length > 20) {
    fields.description = lines.slice(0, 3).join(" ").slice(0, 500);
    filledFields.push("description");
  }

  const brand = ocrOutput?.detectedBrands?.[0] || aiAnalysis?.suggestedBrand;
  if (brand) {
    fields.brand = brand;
    filledFields.push("brand");
  }

  if (aiAnalysis?.suggestedCategory && aiAnalysis.suggestedCategory !== "General") {
    fields.category = aiAnalysis.suggestedCategory;
    filledFields.push("category");
  } else if (/apparel|shirt|dress|electronics|phone|headphone/i.test(text)) {
    fields.category = /apparel|shirt|dress/i.test(text) ? "Apparel" : "Electronics";
    filledFields.push("category");
  }

  const priceMatch = text.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/i);
  if (priceMatch) {
    fields.price = Number(priceMatch[1].replace(/,/g, ""));
    filledFields.push("price");
  }

  const mrpMatch = text.match(/MRP[:\s]*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{2})?)/i);
  if (mrpMatch) {
    fields.mrp = Number(mrpMatch[1].replace(/,/g, ""));
    filledFields.push("mrp");
  }

  if (/out\s*of\s*stock/i.test(text)) {
    fields.availability = "out_of_stock";
    filledFields.push("availability");
  } else if (/limited/i.test(text)) {
    fields.availability = "limited";
    filledFields.push("availability");
  } else if (/in\s*stock|available/i.test(text)) {
    fields.availability = "in_stock";
    filledFields.push("availability");
  }

  const colorMatch = text.match(
    /\b(black|white|red|blue|green|yellow|pink|grey|gray|brown|navy|beige)\b/i
  );
  if (colorMatch) {
    fields.color = colorMatch[1];
    filledFields.push("color");
  }

  const sizeMatch = text.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL|\d{2,3}\s?(?:cm|inch|in))\b/i);
  if (sizeMatch) {
    fields.size = sizeMatch[1].toUpperCase();
    filledFields.push("size");
  }

  const materialMatch = text.match(
    /\b(cotton|polyester|leather|plastic|metal|wood|silk|wool|linen|rubber|nylon|mesh)\b/i
  );
  if (materialMatch) {
    fields.material = materialMatch[1];
    filledFields.push("material");
  }

  return { fields, filledFields: [...new Set(filledFields)] };
}
