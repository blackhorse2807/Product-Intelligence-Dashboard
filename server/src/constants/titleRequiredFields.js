/**
 * Fields required before a suitable marketplace title can be built.
 */
export const TITLE_ESSENTIAL_FIELDS = [
  { key: "product_title", label: "Product Title", dbKey: "title" },
  { key: "brand", label: "Brand", dbKey: "brand" },
  { key: "category", label: "Category", dbKey: "category" },
];

export const TITLE_ESSENTIAL_DB_KEYS = TITLE_ESSENTIAL_FIELDS.map((f) => f.dbKey);
