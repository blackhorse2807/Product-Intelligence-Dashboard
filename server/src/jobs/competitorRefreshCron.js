import cron from "node-cron";
import { Product } from "../models/Product.js";
import { refreshCompetitorPrices } from "../services/competitorPricingService.js";
import { parseProductAmount } from "../utils/productPricing.js";

let cronTask = null;
let isRunning = false;

async function refreshAllCompetitorPrices() {
  if (isRunning) {
    console.log("[cron] Competitor refresh skipped — previous run still in progress");
    return;
  }

  isRunning = true;
  const started = Date.now();

  try {
    const products = await Product.find({
      $or: [{ price: { $gt: 0 } }, { mrp: { $gt: 0 } }],
    }).select("_id skuId price mrp");

    const eligible = products.filter(
      (p) => parseProductAmount(p.price) > 0 || parseProductAmount(p.mrp) > 0
    );

    let refreshed = 0;
    let failed = 0;

    for (const product of eligible) {
      try {
        await refreshCompetitorPrices(product._id);
        refreshed += 1;
      } catch (err) {
        failed += 1;
        console.warn(
          `[cron] Competitor refresh failed for ${product.skuId || product._id}:`,
          err.message
        );
      }
    }

    console.log(
      `[cron] Competitor refresh complete — ${refreshed} refreshed, ${failed} failed, ${Date.now() - started}ms`
    );
  } catch (err) {
    console.error("[cron] Competitor refresh batch failed:", err.message);
  } finally {
    isRunning = false;
  }
}

export function startCompetitorRefreshCron() {
  if (cronTask) return cronTask;

  // Every minute
  cronTask = cron.schedule("* * * * *", refreshAllCompetitorPrices, {
    scheduled: true,
  });

  console.log("[cron] Competitor pricing auto-refresh scheduled (every 1 minute)");
  return cronTask;
}

export function stopCompetitorRefreshCron() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
}
