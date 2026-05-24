export function parseProductAmount(value) {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

export function hasProductPricing(product) {
  if (!product) return false;
  return parseProductAmount(product.mrp) > 0 || parseProductAmount(product.price) > 0;
}
