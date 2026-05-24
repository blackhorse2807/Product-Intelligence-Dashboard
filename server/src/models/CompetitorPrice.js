import mongoose from "mongoose";

const competitorPriceSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    platform: { type: String, required: true, trim: true },
    competitorPrice: { type: Number, required: true },
    priceDifference: { type: Number, default: 0 },
    percentageDifference: { type: Number, default: 0 },
    lastCheckedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

competitorPriceSchema.index({ productId: 1, platform: 1 });

export const CompetitorPrice = mongoose.model("CompetitorPrice", competitorPriceSchema);
