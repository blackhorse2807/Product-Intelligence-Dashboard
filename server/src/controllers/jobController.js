import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { Job } from "../models/Job.js";
import { assertJobOwner } from "../utils/ownership.js";

export const getJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).limit(50);
  return successResponse(res, jobs, "Jobs fetched");
});

export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    const err = new Error("Job not found");
    err.statusCode = 404;
    throw err;
  }

  assertJobOwner(job, req.user._id);

  return successResponse(res, job, "Job fetched");
});
