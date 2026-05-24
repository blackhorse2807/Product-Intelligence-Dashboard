import {
  cleanValue,
  dedupeWords,
  formatMaterialPhrase,
  normalizeSpacing,
  toTitleCase,
  truncateTitle,
} from "../utils/titleTextUtils.js";
import { validateTitle } from "../validators/titleValidator.js";

const PLACEHOLDER_TITLES = ["pending review", "extracted product"];

/**
 * Use only seller-provided catalog fields on the product document.
 * Ignores OCR/AI suggestions from extractedAttributes.
 */
function normalizeProductInput(product) {
  const title = cleanValue(product.title);
  const safeTitle = PLACEHOLDER_TITLES.includes(title.toLowerCase()) ? "" : title;

  return {
    title: safeTitle,
    brand: cleanValue(product.brand),
    color: cleanValue(product.color),
    category: cleanValue(product.category),
    material: cleanValue(product.material),
    size: cleanValue(product.size),
  };
}

function formatSizePhrase(size) {
  const s = cleanValue(size);
  if (!s) return "";
  if (/^size\b/i.test(s)) return toTitleCase(s);
  return `Size ${s.toUpperCase() === s ? s : toTitleCase(s)}`;
}

function buildTitleParts(data) {
  const usedAttributes = [];
  const skippedAttributes = [];
  const parts = [];

  const addPart = (key, value) => {
    const v = cleanValue(value);
    if (!v) {
      skippedAttributes.push(key);
      return;
    }
    parts.push(v);
    usedAttributes.push(key);
  };

  addPart("brand", toTitleCase(data.brand));
  addPart("color", toTitleCase(data.color));
  addPart("category", toTitleCase(data.category));

  const sizePhrase = formatSizePhrase(data.size);
  if (sizePhrase) {
    parts.push(sizePhrase);
    usedAttributes.push("size");
  } else {
    skippedAttributes.push("size");
  }

  const materialPhrase = formatMaterialPhrase(data.material);
  if (materialPhrase) {
    parts.push(materialPhrase);
    usedAttributes.push("material");
  } else {
    skippedAttributes.push("material");
  }

  return { parts, usedAttributes, skippedAttributes };
}

function fallbackTitle(data) {
  if (data.brand && data.category) {
    return dedupeWords(`${toTitleCase(data.brand)} ${toTitleCase(data.category)}`);
  }
  if (data.brand) return toTitleCase(data.brand);
  if (data.category) return toTitleCase(data.category);
  if (data.title) return toTitleCase(data.title);
  return "Generic Product";
}

function tokenizePhrases(text) {
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  const phrases = [];
  if (words.length >= 2) phrases.push(words.slice(0, 2).join(" "));
  if (words.length >= 3) phrases.push(words.slice(0, 3).join(" "));
  return phrases;
}

function generateKeywords(data) {
  const keywords = new Set();

  const addTokens = (text) => {
    const t = cleanValue(text).toLowerCase();
    if (!t || t.length < 3) return;
    keywords.add(t);
    tokenizePhrases(t).forEach((p) => keywords.add(p));
  };

  if (data.category) addTokens(data.category);
  if (data.color && data.category) addTokens(`${data.color} ${data.category}`);
  if (data.material) addTokens(data.material);
  if (data.size && data.category) addTokens(`${data.size} ${data.category}`);
  if (data.brand) addTokens(data.brand);

  return [...keywords]
    .filter((k) => k && k.length > 2 && !["for", "the", "and", "with", "size"].includes(k))
    .slice(0, 8);
}

function generateReason(usedAttributes, skippedAttributes) {
  const labels = {
    brand: "brand",
    color: "color",
    category: "category",
    size: "size",
    material: "material",
  };

  const added = usedAttributes.map((k) => labels[k]).filter(Boolean);

  if (!added.length) {
    return "Structured the title using your saved product details for clearer marketplace listings.";
  }

  let reason = `Built the title from your saved fields: ${added.join(", ")}.`;

  if (skippedAttributes.length) {
    const skipUnique = [...new Set(skippedAttributes)].slice(0, 4);
    reason += ` Add ${skipUnique.join(", ")} in product details to enrich the title further.`;
  }

  return reason;
}

/**
 * Generate enhanced ecommerce title + keywords (no AI, manual fields only).
 */
export function generateEnhancedTitle(product) {
  const data = normalizeProductInput(product);
  const originalTitle = data.title || cleanValue(product.title) || "Pending Review";

  const { parts, usedAttributes, skippedAttributes } = buildTitleParts(data);

  let enhancedTitle = parts.length
    ? dedupeWords(parts.join(" "))
    : fallbackTitle(data);

  enhancedTitle = truncateTitle(normalizeSpacing(enhancedTitle), 90);

  if (enhancedTitle.length < 10) {
    enhancedTitle = truncateTitle(fallbackTitle(data), 90);
  }

  const keywords = generateKeywords(data);
  const reason = generateReason(usedAttributes, skippedAttributes);

  return {
    originalTitle,
    enhancedTitle,
    keywords,
    usedAttributes: [...new Set(usedAttributes)],
    skippedAttributes: [...new Set(skippedAttributes)],
    reason,
    titleValidation: validateTitle(enhancedTitle, {
      brand: data.brand,
      category: data.category,
      productType: data.category,
    }),
  };
}
