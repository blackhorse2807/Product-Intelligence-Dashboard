import { TITLE_ESSENTIAL_FIELDS } from "../constants/titleRequiredFields.js";
import { isCatalogValueMissing } from "./missingFields.js";

export function getMissingTitleEssentialFields(product) {
  return TITLE_ESSENTIAL_FIELDS.filter((field) =>
    isCatalogValueMissing(field.dbKey, product[field.dbKey])
  );
}

export function assertTitleEssentials(product) {
  const missing = getMissingTitleEssentialFields(product);
  if (!missing.length) return;

  const labels = missing.map((m) => m.label).join(", ");
  const err = new Error(
    `Required for product title: ${labels}. Please fill these fields before saving.`
  );
  err.statusCode = 400;
  err.missingTitleFields = missing;
  throw err;
}
