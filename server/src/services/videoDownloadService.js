import axios from "axios";
import fs from "fs-extra";
import { createWriteStream } from "fs";
import path from "path";

const DOWNLOAD_TIMEOUT_MS = 120_000;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/**
 * Download a remote video (e.g. Cloudinary secure_url) to a local temp path.
 */
export async function downloadVideoFromUrl(videoUrl, destPath) {
  if (!videoUrl || !/^https?:\/\//i.test(videoUrl)) {
    throw new Error("Invalid video URL — expected http(s) Cloudinary URL");
  }

  await fs.ensureDir(path.dirname(destPath));

  let response;
  try {
    response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream",
      timeout: DOWNLOAD_TIMEOUT_MS,
      maxContentLength: MAX_VIDEO_BYTES,
      maxRedirects: 5,
      validateStatus: (status) => status === 200,
    });
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      throw new Error("Video download timed out");
    }
    if (err.response?.status === 404) {
      throw new Error("Video not found at the provided URL");
    }
    throw new Error(`Failed to download video: ${err.message}`);
  }

  const contentType = response.headers["content-type"] || "";
  if (contentType && !contentType.includes("video") && !contentType.includes("octet-stream")) {
    throw new Error(`Unsupported remote content type: ${contentType}`);
  }

  await new Promise((resolve, reject) => {
    const writer = createWriteStream(destPath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
    response.data.on("error", reject);
  });

  const stats = await fs.stat(destPath);
  if (stats.size === 0) {
    await fs.remove(destPath);
    throw new Error("Downloaded video file is empty");
  }

  return destPath;
}
