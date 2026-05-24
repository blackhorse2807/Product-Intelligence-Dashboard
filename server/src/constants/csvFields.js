export const CSV_REQUIRED_HEADERS = [
  "sku_id",
  "product_title",
  "brand",
  "category",
  "price",
  "mrp",
  "availability",
];

export const CSV_OPTIONAL_HEADERS = [
  "description",
  "color",
  "material",
  "size",
  "image_url",
];

export const CSV_ALL_HEADERS = [...CSV_REQUIRED_HEADERS, ...CSV_OPTIONAL_HEADERS];

/** CSV column name → Mongoose Product field */
export const CSV_TO_PRODUCT_MAP = {
  sku_id: "skuId",
  product_title: "title",
  brand: "brand",
  category: "category",
  price: "price",
  mrp: "mrp",
  availability: "availability",
  description: "description",
  color: "color",
  material: "material",
  size: "size",
};
