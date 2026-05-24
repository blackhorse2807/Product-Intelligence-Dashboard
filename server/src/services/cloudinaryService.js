import cloudinary, { assertCloudinaryConfigured } from "../config/cloudinary.js";

export function isCloudinaryConfigured() {
  return Boolean(cloudinary.config().cloud_name && cloudinary.config().api_key);
}

/**
 * Delete a media asset from Cloudinary (videos, images, raw files).
 */
export async function deleteCloudinaryAsset(publicId, resourceType = "video") {
  assertCloudinaryConfigured();
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Auto-generated poster frame URL from a Cloudinary video public ID.
 * No extra upload — derived transformation only.
 */
export function getVideoThumbnailUrl(publicId) {
  return cloudinary.url(publicId, {
    resource_type: "video",
    format: "jpg",
    transformation: [{ width: 600, height: 600, crop: "fill", gravity: "auto" }],
    secure: true,
  });
}

/**
 * Single frame preview from video at a given second offset.
 */
export function getFrameImageUrl(publicId, startOffsetSec) {
  return cloudinary.url(publicId, {
    resource_type: "video",
    format: "jpg",
    transformation: [
      { start_offset: startOffsetSec, width: 640, crop: "scale", quality: "auto" },
    ],
    secure: true,
  });
}

/**
 * Normalize multer-storage-cloudinary file object to consistent media refs.
 */
export function parseCloudinaryFile(file) {
  return {
    url: file.path || file.secure_url,
    publicId: file.filename || file.public_id,
    format: file.format,
    bytes: file.bytes,
    duration: file.duration,
    originalName: file.originalname,
    mimeType: file.mimetype,
  };
}
