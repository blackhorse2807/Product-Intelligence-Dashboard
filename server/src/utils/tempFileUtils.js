import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, "../..");

export const TEMP_FRAMES_ROOT = path.join(SERVER_ROOT, "temp", "frames");
export const TEMP_VIDEOS_ROOT = path.join(SERVER_ROOT, "temp", "videos");

export async function ensureTempDirs() {
  await fs.ensureDir(TEMP_FRAMES_ROOT);
  await fs.ensureDir(TEMP_VIDEOS_ROOT);
}

export function getJobFramesDir(jobId) {
  return path.join(TEMP_FRAMES_ROOT, `job-${jobId}`);
}

export function getJobVideoPath(jobId) {
  return path.join(TEMP_VIDEOS_ROOT, `job-${jobId}`, "source.mp4");
}

/**
 * Remove a temp directory and all contents (frames + downloaded video).
 */
export async function cleanupTempDir(dirPath) {
  if (!dirPath) return;
  try {
    if (await fs.pathExists(dirPath)) {
      await fs.remove(dirPath);
      console.log(`[cleanup] Removed temp directory: ${dirPath}`);
    }
  } catch (err) {
    console.error(`[cleanup] Failed to remove ${dirPath}:`, err.message);
  }
}

/**
 * Cleanup both frame folder and video folder for a job.
 */
export async function cleanupJobTemp(jobId) {
  await cleanupTempDir(getJobFramesDir(jobId));
  await cleanupTempDir(path.join(TEMP_VIDEOS_ROOT, `job-${jobId}`));
}
