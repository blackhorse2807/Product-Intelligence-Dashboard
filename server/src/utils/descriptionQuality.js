const FLUFF_WORDS = ["best", "awesome", "amazing", "premium"];

function normalizeText(description = "") {
  return String(description)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(description) {
  return normalizeText(description)
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Lightweight description quality scoring (deterministic, no AI).
 */
export function analyzeDescriptionQuality(description = "") {
  const text = normalizeText(description);
  const words = tokenize(description);
  const issues = [];
  let score = 100;

  if (text.length < 30) {
    score -= 30;
    issues.push("Description is too short");
  }

  if (words.length < 8) {
    score -= 20;
    issues.push("Description lacks sufficient detail");
  }

  const freq = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }
  const hasExcessiveRepeat = Object.values(freq).some((count) => count > 4);
  if (hasExcessiveRepeat) {
    score -= 15;
    issues.push("Description contains excessive repeated words");
  }

  const fluffCount = FLUFF_WORDS.filter((w) => text.includes(w)).length;
  if (fluffCount >= 2) {
    score -= 15;
    issues.push("Description relies heavily on generic marketing terms");
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    isWeak: score < 60,
    issues,
  };
}
