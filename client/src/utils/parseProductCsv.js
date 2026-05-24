/**
 * Parse first data row of a product CSV into catalog field keys.
 */
export function parseProductCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const values = lines[1].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
  const row = {};

  headers.forEach((h, i) => {
    row[h] = values[i] ?? "";
  });

  const map = {
    sku_id: "skuId",
    sku: "skuId",
    product_title: "title",
    title: "title",
    description: "description",
    brand: "brand",
    category: "category",
    price: "price",
    mrp: "mrp",
    availability: "availability",
    color: "color",
    size: "size",
    material: "material",
  };

  const result = {};
  for (const [csvKey, dbKey] of Object.entries(map)) {
    if (row[csvKey]) {
      if (dbKey === "price" || dbKey === "mrp") {
        result[dbKey] = Number(String(row[csvKey]).replace(/,/g, "")) || 0;
      } else {
        result[dbKey] = row[csvKey];
      }
    }
  }

  return result;
}
