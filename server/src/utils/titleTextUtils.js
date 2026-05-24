const GENDER_MAP = {
  men: "for Men",
  man: "for Men",
  male: "for Men",
  boys: "for Boys",
  boy: "for Boys",
  women: "for Women",
  woman: "for Women",
  female: "for Women",
  girls: "for Girls",
  girl: "for Girls",
  unisex: "Unisex",
};

const MATERIAL_PHRASES = {
  mesh: "with Mesh Upper",
  leather: "with Leather Finish",
  cotton: "Made from Cotton",
  polyester: "Made from Polyester",
  rubber: "with Rubber Sole",
  plastic: "with Durable Plastic Build",
  metal: "with Metal Finish",
  wool: "Made from Wool",
  silk: "Made from Silk",
  nylon: "Made from Nylon",
};

/**
 * Safe string cleanup — returns empty string for invalid values.
 */
export function cleanValue(value) {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/\s+/g, " ").trim();
  if (!str || str.toLowerCase() === "null" || str.toLowerCase() === "undefined") {
    return "";
  }
  return str;
}

export function tokenize(text) {
  return cleanValue(text)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function toTitleCase(text) {
  return cleanValue(text)
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeSpacing(text) {
  return cleanValue(text).replace(/\s+/g, " ");
}

/**
 * Remove duplicate words while preserving order (case-insensitive).
 */
export function dedupeWords(text) {
  const words = normalizeSpacing(text).split(" ");
  const seen = new Set();
  const result = [];

  for (const word of words) {
    const key = word.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(word);
    }
  }

  return result.join(" ");
}

/**
 * Remove duplicate phrases when productType overlaps category.
 */
export function mergeProductTypeAndCategory(productType, category) {
  const pt = cleanValue(productType);
  const cat = cleanValue(category);

  if (!pt && cat) return toTitleCase(cat);
  if (!cat) return toTitleCase(pt);
  if (pt.toLowerCase().includes(cat.toLowerCase())) return toTitleCase(pt);
  if (cat.toLowerCase().includes(pt.toLowerCase())) return toTitleCase(pt);

  return toTitleCase(pt);
}

export function formatGenderPhrase(gender) {
  const g = cleanValue(gender).toLowerCase();
  return GENDER_MAP[g] || "";
}

export function formatMaterialPhrase(material) {
  const m = cleanValue(material).toLowerCase();
  if (!m) return "";

  for (const [key, phrase] of Object.entries(MATERIAL_PHRASES)) {
    if (m.includes(key)) return phrase;
  }

  return `Made from ${toTitleCase(material)}`;
}

export function truncateTitle(text, maxLen = 90) {
  const cleaned = normalizeSpacing(text);
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen - 3).trim() + "...";
}

export function containsPhrase(haystack, needle) {
  if (!haystack || !needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}
