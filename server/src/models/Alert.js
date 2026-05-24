import mongoose from "mongoose";
import { SEVERITY } from "../utils/enums.js";

const alertSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    severity: { type: String, enum: Object.values(SEVERITY), required: true },
    message: { type: String, required: true },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Alert = mongoose.model("Alert", alertSchema);
