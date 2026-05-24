import fs from "fs-extra";
import path from "path";
import { downloadVideoFromUrl } from "./videoDownloadService.js";
import {
  extractFrameAt,
  formatTimestamp,
  getKeyframeTimestamps,
  getVideoDuration,
} from "../utils/ffmpegUtils.js";
import {
  cleanupJobTemp,
  ensureTempDirs,
  getJobFramesDir,
  getJobVideoPath,
} from "../utils/tempFileUtils.js";

const FRAME_PERCENTAGES = [0.2, 0.5, 0.8];

/**
 * Extract 3 key frames (20%, 50%, 80%) from a Cloudinary video URL.
 *
 * @param {string} videoUrl - Cloudinary secure_url
 * @param {{ jobId?: string }} options
 * @returns {Promise<Array<{ frameNumber: number, timestamp: string, path: string }>>}
 */
export async function extractFramesFromVideo(videoUrl, options = {}) {
  const result = await extractFramesFromVideoDetailed(videoUrl, options);
  return result.frames;
}

/**
 * Full extraction result (used by job processor).
 */
export async function extractFramesFromVideoDetailed(videoUrl, options = {}) {
  const jobId = options.jobId || `tmp-${Date.now()}`;
  const framesDir = getJobFramesDir(jobId);
  const videoPath = getJobVideoPath(jobId);

  if (!videoUrl) {
    throw new Error("videoUrl is required for frame extraction");
  }

  await ensureTempDirs();
  await fs.ensureDir(framesDir);
  await fs.ensureDir(path.dirname(videoPath));

  console.log(`[frames] Extraction started — job ${jobId}`);

  try {
    console.log(`[frames] Downloading video from Cloudinary...`);
    await downloadVideoFromUrl(videoUrl, videoPath);

    const duration = await getVideoDuration(videoPath);
    console.log(`[frames] Video duration: ${duration.toFixed(2)}s`);

    const timestamps = getKeyframeTimestamps(duration);
    const frames = [];

    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      const framePath = path.join(framesDir, `frame${i + 1}.jpg`);

      await extractFrameAt(videoPath, framePath, ts);

      if (!(await fs.pathExists(framePath))) {
        throw new Error(`Frame file missing after extraction: frame${i + 1}.jpg`);
      }

      const frame = {
        frameNumber: i + 1,
        timestamp: formatTimestamp(ts),
        timestampSec: ts,
        percentage: FRAME_PERCENTAGES[i],
        path: framePath,
      };

      frames.push(frame);
      console.log(`[frames] Generated frame${i + 1}.jpg @ ${frame.timestamp} (${FRAME_PERCENTAGES[i] * 100}%)`);
    }

    console.log(`[frames] Extraction completed — ${frames.length} frames in ${framesDir}`);

    return {
      jobId,
      duration,
      framesDir,
      videoPath,
      frames,
    };
  } catch (err) {
    console.error(`[frames] Extraction failed — job ${jobId}:`, err.message);
    throw err;
  }
}

/**
 * Run extraction and always cleanup temp files afterward.
 */
export async function extractFramesFromVideoWithCleanup(videoUrl, options = {}) {
  const jobId = options.jobId || `tmp-${Date.now()}`;

  try {
    return await extractFramesFromVideo(videoUrl, { ...options, jobId });
  } finally {
    await cleanupJobTemp(jobId);
    console.log(`[frames] Cleanup completed — job ${jobId}`);
  }
}
