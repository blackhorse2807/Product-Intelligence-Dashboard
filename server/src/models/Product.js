import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    skuId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    brand: { type: String, default: "" },
    category: { type: String, default: "" },
    price: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },

    // Cloudinary media references (URLs + public IDs only — no binary data)
    videoUrl: { type: String, default: "" },
    videoPublicId: { type: String, default: "", index: true },
    imagePublicId: { type: String, default: "", index: true },
    availability: {
      type: String,
      enum: ["in_stock", "out_of_stock", "limited", ""],
      default: "",
    },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    material: { type: String, default: "" },
    extractedAttributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    enhancedTitle: { type: String, default: "" },
    activeTitleSource: {
      type: String,
      enum: ["original", "enhanced", ""],
      default: "",
    },
    suggestedKeywords: [{ type: String }],
    qualityScore: { type: Number, min: 0, max: 100, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
