import { processJob } from "../jobs/jobProcessor.js";

/**
 * Fire-and-forget async job processing (replace with Bull/BullMQ in production).
 */
export function enqueueJob(jobId) {
  setImmediate(() => {
    processJob(jobId).catch((err) => {
      console.error(`[Job ${jobId}] processing failed:`, err.message);
    });
  });
}
