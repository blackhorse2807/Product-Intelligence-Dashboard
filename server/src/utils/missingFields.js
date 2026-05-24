import { CATALOG_FIELDS } from "../constants/catalogFields.js";

const PLACEHOLDER_TITLES = ["pending review", "extracted product", ""];

export function isCatalogValueMissing(dbKey, value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return true;
    if (dbKey === "title" && PLACEHOLDER_TITLES.includes(t.toLowerCase())) return true;
    if (dbKey === "skuId" && /^PENDING-/i.test(t)) return true;
    return false;
  }
  if (dbKey === "price" || dbKey === "mrp") {
    return !value || Number(value) <= 0;
  }
  return false;
}

export function getMissingCatalogFields(product, filledFields = []) {
  return CATALOG_FIELDS.filter((field) => {
    const value = product[field.dbKey];
    return (
      !filledFields.includes(field.dbKey) || isCatalogValueMissing(field.dbKey, value)
    );
  }).map((field) => ({
    key: field.key,
    label: field.label,
    dbKey: field.dbKey,
  }));
}

export function buildCatalogFieldRows(product, filledFields = []) {
  return CATALOG_FIELDS.map((field) => {
    const value = product[field.dbKey];
    const missing =
      !filledFields.includes(field.dbKey) || isCatalogValueMissing(field.dbKey, value);

    return {
      key: field.key,
      label: field.label,
      dbKey: field.dbKey,
      value: formatCatalogValue(field.dbKey, value),
      status: missing ? "missing" : "filled",
    };
  });
}

function formatCatalogValue(dbKey, value) {
  if (isCatalogValueMissing(dbKey, value)) return null;
  if (dbKey === "price" || dbKey === "mrp") return Number(value);
  if (dbKey === "availability") return String(value).replace(/_/g, " ");
  return String(value);
}
