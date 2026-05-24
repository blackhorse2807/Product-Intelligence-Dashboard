import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { formatTimestamp } from "./timeUtils.js";

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const FRAME_WIDTH = 640;
const FRAME_QUALITY = 4;
const FRAME_EXTRACT_TIMEOUT_MS = 90_000;
const FFPROBE_TIMEOUT_MS = 30_000;

export { formatTimestamp };

/**
 * Get video duration in seconds via ffprobe.
 */
export function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("ffprobe timed out while reading video duration"));
    }, FFPROBE_TIMEOUT_MS);

    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      clearTimeout(timer);
      if (err) {
        reject(new Error(`Failed to read video metadata: ${err.message}`));
        return;
      }

      const duration = metadata?.format?.duration;
      if (!duration || Number.isNaN(duration) || duration <= 0) {
        reject(new Error("Could not determine video duration"));
        return;
      }

      resolve(Number(duration));
    });
  });
}

/**
 * Extract a single JPEG frame at a given second (optimized width).
 */
export function extractFrameAt(videoPath, outputPath, timestampSec) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Frame extraction timed out at ${formatTimestamp(timestampSec)}`));
    }, FRAME_EXTRACT_TIMEOUT_MS);

    ffmpeg(videoPath)
      .seekInput(Math.max(0, timestampSec))
      .frames(1)
      .size(`${FRAME_WIDTH}x?`)
      .outputOptions(["-q:v", String(FRAME_QUALITY)])
      .output(outputPath)
      .on("end", () => {
        clearTimeout(timer);
        resolve(outputPath);
      })
      .on("error", (err) => {
        clearTimeout(timer);
        reject(new Error(`ffmpeg frame extraction failed: ${err.message}`));
      })
      .run();
  });
}

/**
 * Timestamps at 20%, 50%, 80% of total duration.
 */
export function getKeyframeTimestamps(durationSec) {
  return [0.2, 0.5, 0.8].map((ratio) => Number((durationSec * ratio).toFixed(2)));
}
