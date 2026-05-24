import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { Product } from "../models/Product.js";
import { ProductIssue } from "../models/ProductIssue.js";
import { CompetitorPrice } from "../models/CompetitorPrice.js";
import { Alert } from "../models/Alert.js";
import { JOB_STATUS, JOB_TYPES } from "../utils/enums.js";
import { Job } from "../models/Job.js";
import { serializeProductDetails } from "../utils/productDetailsSerializer.js";
import { getMissingCatalogFields } from "../utils/missingFields.js";
import { assertTitleEssentials } from "../utils/titleEssentials.js";
import { validateProduct } from "../services/validationService.js";
import { generateEnhancedTitle } from "../services/titleGenerationService.js";
import {
  getCompetitorPricingPayload,
  refreshCompetitorPrices,
} from "../services/competitorPricingService.js";
import { hasProductPricing, parseProductAmount } from "../utils/productPricing.js";
import {
  buildProductReportCsv,
  buildProductReportJson,
} from "../services/productReportService.js";

export const getProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find().sort({ updatedAt: -1 });
  return successResponse(res, products, "Products fetched");
});

export const createProduct = asyncHandler(async (req, res) => {
  const allowed = [
    "skuId",
    "title",
    "description",
    "brand",
    "category",
    "price",
    "mrp",
    "availability",
    "color",
    "size",
    "material",
  ];

  const body = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === "price" || key === "mrp") {
        body[key] = parseProductAmount(req.body[key]);
      } else {
        body[key] = req.body[key];
      }
    }
  }

  const product = new Product({
    skuId: body.skuId || `MANUAL-${Date.now()}`,
    title: body.title || "",
    description: body.description || "",
    brand: body.brand || "",
    category: body.category || "",
    price: body.price || 0,
    mrp: body.mrp || 0,
    availability: body.availability || "in_stock",
    color: body.color || "",
    size: body.size || "",
    material: body.material || "",
    createdBy: req.user?._id,
    extractedAttributes: {
      source: "manual_upload",
      manualFieldsSaved: true,
      filledFields: Object.keys(body).filter((k) => body[k] !== "" && body[k] !== 0),
    },
  });

  assertTitleEssentials(product);

  const validation = await validateProduct(product.toObject());
  product.qualityScore = validation.qualityScore;

  if (hasProductPricing(product)) {
    const enhancement = generateEnhancedTitle(product.toObject());
    product.enhancedTitle = enhancement.enhancedTitle;
    product.suggestedKeywords = enhancement.keywords;
    product.extractedAttributes = {
      ...product.extractedAttributes,
      titleEnhancement: enhancement,
      savedOriginalTitle: product.title,
    };
  }

  await product.save();

  let competitorPricing = null;
  if (hasProductPricing(product)) {
    try {
      competitorPricing = await refreshCompetitorPrices(product._id);
    } catch (err) {
      console.warn("[product] Competitor pricing on create skipped:", err.message);
    }
  }

  return successResponse(
    res,
    { product: product.toObject(), validation, competitorPricing },
    "Product created successfully",
    201
  );
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const [storedIssues, competitorPrices, alerts] = await Promise.all([
    ProductIssue.find({ productId: product._id }).sort({ createdAt: -1 }),
    CompetitorPrice.find({ productId: product._id }).sort({ lastCheckedAt: -1 }),
    Alert.find({ productId: product._id }).sort({ createdAt: -1 }),
  ]);

  const validation = await validateProduct(product.toObject(), {
    excludeProductId: product._id,
  });

  const competitorPricing = await getCompetitorPricingPayload(product);

  const payload = serializeProductDetails(product.toObject(), {
    issues: validation.issues,
    storedIssues,
    validation,
    competitorPrices,
    competitorPricing,
    alerts,
  });

  return successResponse(res, payload, "Product fetched");
});

export const updateProduct = asyncHandler(async (req, res) => {
  const allowed = [
    "skuId",
    "title",
    "description",
    "brand",
    "category",
    "price",
    "mrp",
    "availability",
    "color",
    "size",
    "material",
  ];
  const updates = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === "price" || key === "mrp") {
        updates[key] = parseProductAmount(req.body[key]);
      } else {
        updates[key] = req.body[key];
      }
    }
  }

  if (!Object.keys(updates).length) {
    const err = new Error("No valid fields provided for update");
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  Object.assign(product, updates);

  assertTitleEssentials(product);

  const filledFields = product.extractedAttributes?.filledFields || [];
  const mergedFilled = [
    ...new Set([
      ...filledFields,
      ...Object.keys(updates).filter((k) => {
        const v = updates[k];
        if (k === "price" || k === "mrp") return parseProductAmount(v) > 0;
        return v !== "" && v !== null && v !== undefined;
      }),
    ]),
  ];
  const missingKeys = getMissingCatalogFields(product, mergedFilled).map((m) => m.key);

  const validation = await validateProduct(product.toObject(), {
    excludeProductId: product._id,
  });

  product.qualityScore = validation.qualityScore;
  product.extractedAttributes = {
    ...product.extractedAttributes,
    filledFields: mergedFilled,
    missingFields: missingKeys,
    manualFieldsSaved: true,
    descriptionQuality: validation.descriptionQuality,
    validationSummary: {
      qualityScore: validation.qualityScore,
      issueCount: validation.issues.length,
    },
  };

  await product.save();

  if (hasProductPricing(product)) {
    try {
      await refreshCompetitorPrices(product._id);
    } catch (err) {
      console.warn("[product] Competitor price refresh skipped:", err.message);
    }
  }

  await ProductIssue.deleteMany({ productId: product._id });
  if (validation.issues.length) {
    await ProductIssue.insertMany(
      validation.issues.map((item) => ({
        productId: product._id,
        severity: item.severity,
        type: item.type,
        message: item.message,
        suggestedFix: item.suggestedFix || "",
      }))
    );
  }

  const competitorPricing = await getCompetitorPricingPayload(product);

  return successResponse(
    res,
    { product, validation, competitorPricing, hasPricing: hasProductPricing(product) },
    "Product updated successfully"
  );
});

export const enhanceTitle = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  if (!product.extractedAttributes?.manualFieldsSaved) {
    const err = new Error(
      "Please upload product details (manual entry or CSV) before generating an enhanced title."
    );
    err.statusCode = 400;
    throw err;
  }

  const enhancement = generateEnhancedTitle(product.toObject());

  product.enhancedTitle = enhancement.enhancedTitle;
  product.suggestedKeywords = enhancement.keywords;
  product.activeTitleSource = product.activeTitleSource || "original";
  product.extractedAttributes = {
    ...product.extractedAttributes,
    savedOriginalTitle: enhancement.originalTitle,
    titleEnhancement: {
      ...enhancement,
      originalTitle: enhancement.originalTitle,
    },
  };

  await product.save();

  return successResponse(
    res,
    {
      ...enhancement,
      activeTitleSource: product.activeTitleSource,
      currentTitle: product.title,
    },
    "Title enhanced successfully"
  );
});

export const setActiveTitleSource = asyncHandler(async (req, res) => {
  const { source } = req.body;

  if (!["original", "enhanced"].includes(source)) {
    const err = new Error('source must be "original" or "enhanced"');
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const enhancement = product.extractedAttributes?.titleEnhancement;
  const originalTitle =
    enhancement?.originalTitle || product.extractedAttributes?.savedOriginalTitle || "";
  const enhancedTitle = product.enhancedTitle;

  if (!enhancedTitle) {
    const err = new Error("Generate an enhanced title first");
    err.statusCode = 400;
    throw err;
  }

  if (source === "enhanced") {
    if (!product.extractedAttributes?.savedOriginalTitle && product.title !== enhancedTitle) {
      product.extractedAttributes = {
        ...product.extractedAttributes,
        savedOriginalTitle: product.title,
      };
    }
    product.title = enhancedTitle;
    product.activeTitleSource = "enhanced";
  } else {
    const revertTitle = originalTitle || product.extractedAttributes?.savedOriginalTitle;
    if (!revertTitle) {
      const err = new Error("Original title not available");
      err.statusCode = 400;
      throw err;
    }
    product.title = revertTitle;
    product.activeTitleSource = "original";
  }

  await product.save();

  const validation = await validateProduct(product.toObject(), {
    excludeProductId: product._id,
  });

  product.qualityScore = validation.qualityScore;
  await product.save();

  return successResponse(
    res,
    {
      product: product.toObject(),
      activeTitleSource: product.activeTitleSource,
      currentTitle: product.title,
      originalTitle: originalTitle || product.extractedAttributes?.savedOriginalTitle,
      enhancedTitle: product.enhancedTitle,
    },
    "Listing title updated"
  );
});

export const getCompetitorPrices = asyncHandler(async (req, res) => {
  const prices = await CompetitorPrice.find({ productId: req.params.id }).sort({ lastCheckedAt: -1 });
  return successResponse(res, prices, "Competitor prices fetched");
});

export const downloadProductReport = asyncHandler(async (req, res) => {
  const format = String(req.query.format || "csv").toLowerCase();

  if (format === "json") {
    const report = await buildProductReportJson(req.params.id);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="product-report-${report.product.skuId || req.params.id}.json"`
    );
    return res.send(JSON.stringify(report, null, 2));
  }

  const { filename, content, mimeType } = await buildProductReportCsv(req.params.id);
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(content);
});
