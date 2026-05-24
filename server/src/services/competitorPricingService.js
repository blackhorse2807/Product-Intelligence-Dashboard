import { Product } from "../models/Product.js";
import { CompetitorPrice } from "../models/CompetitorPrice.js";
import { Alert } from "../models/Alert.js";
import { SEVERITY } from "../utils/enums.js";
import { parseProductAmount, hasProductPricing } from "../utils/productPricing.js";

export const FLIPKART_PLATFORM = "Flipkart";

export const COMPETITOR_PLATFORMS = [
  { name: "Amazon", minPct: -0.1, maxPct: 0.1 },
  { name: "Myntra", minPct: 0, maxPct: 0.15 },
  { name: "Ajio", minPct: -0.15, maxPct: 0.05 },
  { name: "Nykaa Fashion", minPct: -0.05, maxPct: 0.1 },
  { name: "Tata Cliq", minPct: -0.1, maxPct: 0.1 },
  { name: "Meesho", minPct: -0.2, maxPct: 0 },
];

function seededUnit(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 10000) / 10000;
}

function roundPrice(value) {
  return Math.max(1, Math.round(value));
}

/**
 * Generate simulated competitor prices from product MRP with platform-specific variance.
 */
export function generateCompetitorPrices(product, { refreshToken = Date.now() } = {}) {
  const mrp = parseProductAmount(product.mrp) || parseProductAmount(product.price);
  if (mrp <= 0) {
    return [];
  }

  const productKey = String(product._id || product.skuId || "product");

  return COMPETITOR_PLATFORMS.map((platform) => {
    const seed = `${productKey}:${platform.name}:${refreshToken}`;
    const unit = seededUnit(seed);
    const variancePct = platform.minPct + unit * (platform.maxPct - platform.minPct);
    const competitorPrice = roundPrice(mrp * (1 + variancePct));
    const flipkartPrice = parseProductAmount(product.price) || mrp;
    const priceDifference = flipkartPrice - competitorPrice;
    const percentageDifference =
      competitorPrice > 0 ? Number(((priceDifference / competitorPrice) * 100).toFixed(1)) : 0;

    return {
      platform: platform.name,
      competitorPrice,
      priceDifference,
      percentageDifference,
      lastCheckedAt: new Date(),
    };
  });
}

/**
 * Aggregate competitor pricing analytics (Flipkart = our listing price).
 */
export function calculatePriceAnalytics(flipkartPrice, competitorPrices = []) {
  const prices = competitorPrices.map((p) => p.competitorPrice).filter((p) => p > 0);

  if (!prices.length) {
    return {
      flipkartPrice,
      lowestCompetitorPrice: 0,
      highestCompetitorPrice: 0,
      averageCompetitorPrice: 0,
      priceGap: 0,
      percentageDifference: 0,
    };
  }

  const lowestCompetitorPrice = Math.min(...prices);
  const highestCompetitorPrice = Math.max(...prices);
  const averageCompetitorPrice = Math.round(
    prices.reduce((sum, p) => sum + p, 0) / prices.length
  );
  const priceGap = flipkartPrice - lowestCompetitorPrice;
  const percentageDifference =
    lowestCompetitorPrice > 0
      ? Number(((priceGap / lowestCompetitorPrice) * 100).toFixed(1))
      : 0;

  return {
    flipkartPrice,
    lowestCompetitorPrice,
    highestCompetitorPrice,
    averageCompetitorPrice,
    priceGap,
    percentageDifference,
  };
}

/**
 * Deterministic pricing recommendation from Flipkart vs market position.
 */
export function generatePriceRecommendation(flipkartPrice, analytics) {
  const { lowestCompetitorPrice, averageCompetitorPrice, percentageDifference } = analytics;

  if (!lowestCompetitorPrice || !flipkartPrice) {
    return {
      severity: SEVERITY.LOW,
      action: "Add MRP and selling price to run competitor analysis.",
      message: "Pricing data incomplete.",
      icon: "info",
    };
  }

  if (flipkartPrice > lowestCompetitorPrice * 1.1) {
    const pct = Math.abs(percentageDifference);
    return {
      severity: SEVERITY.HIGH,
      action: "Reduce price to remain competitive.",
      message: `Flipkart price is ${pct}% higher than the lowest competitor.`,
      icon: "warning",
    };
  }

  if (flipkartPrice < lowestCompetitorPrice * 0.9) {
    return {
      severity: SEVERITY.MEDIUM,
      action: "Opportunity to improve margins.",
      message: "Flipkart price is significantly lower than competitors.",
      icon: "insight",
    };
  }

  const nearAverage =
    Math.abs(flipkartPrice - averageCompetitorPrice) <= averageCompetitorPrice * 0.05;

  if (nearAverage || percentageDifference <= 10) {
    return {
      severity: SEVERITY.LOW,
      action: "Competitively priced.",
      message: "Competitively priced.",
      icon: "success",
    };
  }

  if (flipkartPrice > averageCompetitorPrice) {
    return {
      severity: SEVERITY.MEDIUM,
      action: "Product pricing is above market average.",
      message: "Product pricing is above market average.",
      icon: "warning",
    };
  }

  return {
    severity: SEVERITY.LOW,
    action: "Competitively priced.",
    message: "Competitively priced.",
    icon: "success",
  };
}

export async function generatePricingAlerts(productId, recommendation) {
  await Alert.deleteMany({
    productId,
    message: {
      $regex: /Flipkart price|Competitively priced|Opportunity to improve|market average/i,
    },
  });

  if (!recommendation?.message) return [];

  return Alert.insertMany([
    {
      productId,
      severity: recommendation.severity,
      message: recommendation.message,
      resolved: false,
    },
  ]);
}

export function buildPricingTableRows(flipkartPrice, competitorRecords) {
  const flipkartRow = {
    platform: FLIPKART_PLATFORM,
    competitorPrice: flipkartPrice,
    priceDifference: 0,
    percentageDifference: 0,
    isOwnPlatform: true,
    lastCheckedAt: new Date(),
  };

  const rows = competitorRecords.map((row) => ({
    platform: row.platform,
    competitorPrice: row.competitorPrice,
    priceDifference: row.priceDifference,
    percentageDifference: row.percentageDifference,
    isOwnPlatform: false,
    lastCheckedAt: row.lastCheckedAt,
  }));

  return [flipkartRow, ...rows];
}

export async function refreshCompetitorPrices(productId) {
  const product = await Product.findById(productId);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const mrp = parseProductAmount(product.mrp) || parseProductAmount(product.price);
  if (mrp <= 0) {
    const err = new Error("Product MRP is required to generate competitor prices");
    err.statusCode = 400;
    throw err;
  }

  const generated = generateCompetitorPrices(product.toObject());
  const flipkartPrice = parseProductAmount(product.price) || mrp;

  await CompetitorPrice.deleteMany({ productId: product._id });

  const saved = await CompetitorPrice.insertMany(
    generated.map((row) => ({
      productId: product._id,
      platform: row.platform,
      competitorPrice: row.competitorPrice,
      priceDifference: row.priceDifference,
      percentageDifference: row.percentageDifference,
      lastCheckedAt: row.lastCheckedAt,
    }))
  );

  const analytics = calculatePriceAnalytics(flipkartPrice, saved);
  const recommendation = generatePriceRecommendation(flipkartPrice, analytics);
  await generatePricingAlerts(product._id, recommendation);

  const lastCheckedAt = saved[0]?.lastCheckedAt || new Date();

  return {
    prices: buildPricingTableRows(flipkartPrice, saved),
    analytics,
    recommendation,
    lastCheckedAt,
    competitorRecords: saved,
  };
}

export async function getCompetitorPricingPayload(product) {
  const productId = product?._id ?? product?.id;
  const flipkartPrice = parseProductAmount(product.price) || parseProductAmount(product.mrp);
  let records = productId
    ? await CompetitorPrice.find({ productId }).sort({ platform: 1 })
    : [];

  const needsGeneration =
    !records.length && hasProductPricing(product) && productId;

  if (needsGeneration) {
    try {
      const refreshed = await refreshCompetitorPrices(productId);
      return {
        prices: refreshed.prices,
        analytics: refreshed.analytics,
        recommendation: refreshed.recommendation,
        lastCheckedAt: refreshed.lastCheckedAt,
      };
    } catch (err) {
      console.warn("[pricing] Auto-generate skipped:", err.message);
    }
  }

  if (!records.length) {
    const analytics = calculatePriceAnalytics(flipkartPrice, []);
    return {
      prices: flipkartPrice
        ? [{ platform: FLIPKART_PLATFORM, competitorPrice: flipkartPrice, isOwnPlatform: true }]
        : [],
      analytics,
      recommendation: generatePriceRecommendation(flipkartPrice, analytics),
      lastCheckedAt: null,
    };
  }

  const analytics = calculatePriceAnalytics(flipkartPrice, records);
  const recommendation = generatePriceRecommendation(flipkartPrice, analytics);
  const lastCheckedAt = records.reduce(
    (latest, row) => (row.lastCheckedAt > latest ? row.lastCheckedAt : latest),
    records[0].lastCheckedAt
  );

  return {
    prices: buildPricingTableRows(flipkartPrice, records),
    analytics,
    recommendation,
    lastCheckedAt,
  };
}
