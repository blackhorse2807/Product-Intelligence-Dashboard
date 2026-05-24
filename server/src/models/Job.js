import mongoose from "mongoose";
import { JOB_STATUS, JOB_TYPES } from "../utils/enums.js";

const jobSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(JOB_TYPES), required: true },
    status: { type: String, enum: Object.values(JOB_STATUS), default: JOB_STATUS.PENDING },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Job = mongoose.model("Job", jobSchema);
