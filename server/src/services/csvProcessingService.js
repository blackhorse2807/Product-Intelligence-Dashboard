import { Readable } from "stream";
import csv from "csv-parser";
import { Product } from "../models/Product.js";
import { CSV_TO_PRODUCT_MAP } from "../constants/csvFields.js";
import {
  normalizeCsvHeader,
  validateHeaders,
  validateProductRow,
} from "../validators/csvValidator.js";
import { generateEnhancedTitle } from "./titleGenerationService.js";
import { analyzeDescriptionQuality } from "../utils/descriptionQuality.js";

function normalizeRowKeys(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeCsvHeader(key)] = typeof value === "string" ? value.trim() : value;
  }
  return normalized;
}

/**
 * Parse CSV buffer into normalized row objects.
 */
export function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    if (!buffer?.length) {
      return reject(new Error("CSV file is empty"));
    }

    const rows = [];
    let headers = [];

    Readable.from(buffer)
      .pipe(
        csv({
          mapHeaders: ({ header }) => normalizeCsvHeader(header),
          mapValues: ({ value }) => (typeof value === "string" ? value.trim() : value),
        })
      )
      .on("headers", (h) => {
        headers = h.map(normalizeCsvHeader);
      })
      .on("data", (row) => {
        rows.push(normalizeRowKeys(row));
      })
      .on("end", () => resolve({ headers, rows }))
      .on("error", reject);
  });
}

export function generateValidationSummary(results) {
  const failedRows = results.filter((r) => !r.isValid);
  const validRows = results.filter((r) => r.isValid);

  const issueBreakdown = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const row of results) {
    for (const item of row.issues) {
      issueBreakdown[item.severity] = (issueBreakdown[item.severity] || 0) + 1;
    }
  }

  return {
    totalRows: results.length,
    validRows: validRows.length,
    invalidRows: failedRows.length,
    issueBreakdown,
    failedRows: failedRows.map((row) => ({
      rowNumber: row.rowNumber,
      sku_id: row.normalizedRow?.sku_id || row.sku_id || "",
      product_title: row.normalizedRow?.product_title || "",
      isValid: false,
      qualityScore: row.qualityScore,
      issues: row.issues,
    })),
    importedProductIds: results.filter((r) => r.productId).map((r) => r.productId),
  };
}

function rowToProductDoc(normalizedRow, enhancement, qualityScore, userId) {
  return {
    skuId: normalizedRow.sku_id,
    title: normalizedRow.product_title,
    description: normalizedRow.description || "",
    brand: normalizedRow.brand || "",
    category: normalizedRow.category || "",
    price: normalizedRow.price,
    mrp: normalizedRow.mrp,
    availability: normalizedRow.availability || "",
    color: normalizedRow.color || "",
    size: normalizedRow.size || "",
    material: normalizedRow.material || "",
    enhancedTitle: enhancement.enhancedTitle,
    suggestedKeywords: enhancement.keywords,
    qualityScore,
    createdBy: userId || undefined,
    extractedAttributes: {
      source: "csv_import",
      manualFieldsSaved: true,
      filledFields: Object.values(CSV_TO_PRODUCT_MAP),
      titleEnhancement: enhancement,
      savedOriginalTitle: normalizedRow.product_title,
      descriptionQuality: analyzeDescriptionQuality(normalizedRow.description || ""),
    },
  };
}

/**
 * Validate all rows, store valid products (partial success).
 */
export async function processCsvRows(rows, userId) {
  if (!rows.length) {
    throw new Error("CSV contains no product rows");
  }

  const seenSkus = new Set();
  const skuList = rows.map((r) => String(r.sku_id || "").trim()).filter(Boolean);
  const existing = userId
    ? await Product.find({ skuId: { $in: skuList }, createdBy: userId }).select("skuId").lean()
    : await Product.find({ skuId: { $in: skuList } }).select("skuId").lean();
  const existingSkus = new Set(existing.map((p) => p.skuId));

  const results = [];

  for (let i = 0; i < rows.length; i += 1) {
    const rowNumber = i + 2; // header is row 1
    const row = normalizeRowKeys(rows[i]);
    const sku = String(row.sku_id || "").trim();

    const duplicateSkuInFile = sku && seenSkus.has(sku);
    if (sku) seenSkus.add(sku);

    const validation = validateProductRow(row, rowNumber, {
      duplicateSkuInFile,
      duplicateSkuInDb: sku && existingSkus.has(sku),
    });

    if (!validation.isValid) {
      results.push({ ...validation, productId: null });
      continue;
    }

    const draftProduct = {
      title: validation.normalizedRow.product_title,
      brand: validation.normalizedRow.brand,
      category: validation.normalizedRow.category,
      color: validation.normalizedRow.color,
      material: validation.normalizedRow.material,
      size: validation.normalizedRow.size,
      price: validation.normalizedRow.price,
      mrp: validation.normalizedRow.mrp,
    };

    const enhancement = generateEnhancedTitle(draftProduct);
    const qualityScore = Math.round((validation.qualityScore + enhancement.titleValidation.score) / 2);

    try {
      const product = await Product.create(
        rowToProductDoc(validation.normalizedRow, enhancement, qualityScore, userId)
      );

      results.push({
        ...validation,
        qualityScore,
        productId: product._id,
        enhancedTitle: enhancement.enhancedTitle,
      });
    } catch (err) {
      if (err.code === 11000) {
        validation.isValid = false;
        validation.issues.push({
          severity: "HIGH",
          type: "DUPLICATE_SKU",
          message: `SKU "${sku}" already exists in your catalog.`,
          suggestedFix: "Use a unique SKU within your account or remove the existing product.",
        });
        validation.qualityScore = Math.max(0, validation.qualityScore - 25);
        results.push({ ...validation, productId: null });
      } else {
        throw err;
      }
    }
  }

  return results;
}

export async function ingestProductsCsv(buffer, userId) {
  const { headers, rows } = await parseCsv(buffer);
  const headerValidation = validateHeaders(headers);

  if (!headerValidation.valid) {
    return {
      success: false,
      missingHeaders: headerValidation.missingHeaders,
      summary: null,
    };
  }

  const rowResults = await processCsvRows(rows, userId);
  const summary = generateValidationSummary(rowResults);

  return {
    success: true,
    missingHeaders: [],
    summary,
    rows: rowResults.map((r) => ({
      rowNumber: r.rowNumber,
      sku_id: r.normalizedRow?.sku_id,
      product_title: r.normalizedRow?.product_title,
      isValid: r.isValid,
      qualityScore: r.qualityScore,
      issues: r.issues,
      productId: r.productId || null,
      enhancedTitle: r.enhancedTitle || null,
    })),
  };
}
