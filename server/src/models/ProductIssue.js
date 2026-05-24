import mongoose from "mongoose";
import { SEVERITY } from "../utils/enums.js";

const productIssueSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    severity: { type: String, enum: Object.values(SEVERITY), required: true },
    type: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    suggestedFix: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ProductIssue = mongoose.model("ProductIssue", productIssueSchema);
