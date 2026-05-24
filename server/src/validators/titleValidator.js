import { cleanValue, tokenize } from "../utils/titleTextUtils.js";

const GENERIC_TERMS = ["best", "awesome", "premium", "amazing", "product", "item"];

function validationIssue(message) {
  return message;
}

/**
 * Validate marketplace product title quality (deterministic).
 */
export function validateTitle(title, product = {}) {
  const text = cleanValue(title);
  const words = tokenize(text);
  const issues = [];
  let score = 100;

  if (text.length < 15 || words.length < 3) {
    score -= 30;
    issues.push(validationIssue("Title is too short"));
  }

  const brand = cleanValue(product.brand);
  if (brand && !text.toLowerCase().includes(brand.toLowerCase())) {
    score -= 20;
    issues.push(validationIssue("Title is missing brand information"));
  }

  const productType = cleanValue(product.productType || product.category);
  const category = cleanValue(product.category);
  const hasType =
    (productType && text.toLowerCase().includes(productType.toLowerCase())) ||
    (category && text.toLowerCase().includes(category.toLowerCase()));

  if (productType || category) {
    if (!hasType) {
      score -= 25;
      issues.push(validationIssue("Title lacks product type information"));
    }
  }

  const freq = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }
  if (Object.values(freq).some((c) => c > 1)) {
    score -= 15;
    issues.push(validationIssue("Title contains repeated words"));
  }

  const genericHits = words.filter((w) => GENERIC_TERMS.includes(w));
  const genericRatio = words.length ? genericHits.length / words.length : 0;
  if (genericRatio >= 0.5 || (words.length <= 3 && genericHits.length >= 2)) {
    score -= 20;
    issues.push(validationIssue("Title lacks meaningful product information"));
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    isWeak: score < 60,
    issues,
  };
}

/**
 * Format for ProductIssue records.
 */
export function titleValidationToIssues(titleValidation) {
  return titleValidation.issues.map((message) => ({
    severity: "MEDIUM",
    type: "WEAK_TITLE",
    message,
    suggestedFix: "Add brand, product type, color, and key attributes.",
  }));
}
