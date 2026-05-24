import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

export function assertCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    const err = new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
    err.statusCode = 500;
    throw err;
  }

  // Cloud name comes from Dashboard → API Keys (e.g. "dxyz12abc") — not your app/project title
  if (cloudName !== cloudName.toLowerCase() || /\s/.test(cloudName)) {
    const err = new Error(
      `Invalid CLOUDINARY_CLOUD_NAME "${cloudName}". Use the exact "Cloud name" from Cloudinary Dashboard → API Keys (lowercase, e.g. dxxxxxxxx).`
    );
    err.statusCode = 500;
    throw err;
  }
}

export default cloudinary;
