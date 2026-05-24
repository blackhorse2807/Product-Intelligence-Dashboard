const PACKAGING_KEYWORDS = [
  "NEW",
  "SALE",
  "OFF",
  "FREE",
  "LIMITED",
  "ORGANIC",
  "PREMIUM",
  "BEST",
  "BUY",
  "GUARANTEED",
  "WARRANTY",
  "100%",
];

const GARBAGE_PATTERN = /[^\w\s.,!?%$#\-+'"/®™]/g;

/**
 * Trim, strip garbage symbols, normalize whitespace, remove empty lines.
 */
export function cleanOcrText(raw = "") {
  if (!raw) return "";

  const normalized = raw
    .replace(GARBAGE_PATTERN, " ")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const uniqueLines = [...new Set(normalized)];
  return uniqueLines.join("\n").trim();
}

/**
 * Merge frame texts and remove duplicate lines across the full OCR output.
 */
export function mergeFrameTexts(frameTexts) {
  const allLines = [];

  for (const text of frameTexts) {
    if (!text) continue;
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !allLines.includes(trimmed)) {
        allLines.push(trimmed);
      }
    }
  }

  return allLines.join("\n");
}

/**
 * Remove consecutive duplicate words (lightweight deduplication).
 */
export function deduplicateWords(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const deduped = [];

  for (const word of words) {
    const prev = deduped[deduped.length - 1];
    if (prev?.toLowerCase() !== word.toLowerCase()) {
      deduped.push(word);
    }
  }

  return deduped.join(" ");
}

/**
 * Likely brand names — capitalized tokens (2+ chars).
 */
export function detectBrandNames(text) {
  const matches = text.match(/\b[A-Z][A-Za-z]{1,}(?:\s+[A-Z][A-Za-z]+)?\b/g) || [];
  const filtered = matches.filter(
    (m) => !PACKAGING_KEYWORDS.includes(m.toUpperCase()) && m.length > 2
  );
  return [...new Set(filtered)].slice(0, 8);
}

/**
 * Uppercase packaging / marketing keywords found in OCR text.
 */
export function detectPackagingKeywords(text) {
  const upper = text.toUpperCase();
  return PACKAGING_KEYWORDS.filter((kw) => upper.includes(kw));
}
