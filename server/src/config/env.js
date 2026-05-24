import "dotenv/config";

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 50,
  jwtSecret: process.env.JWT_SECRET || "dev-quantacus-jwt-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    videoFolder: "quantacus/videos",
    imageFolder: "quantacus/images",
    avatarFolder: "quantacus/avatars",
    csvFolder: "quantacus/csv",
  },
};

if (!env.mongodbUri) {
  console.warn("Warning: MONGODB_URI is not set");
}

if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
  console.warn("Warning: Cloudinary credentials are not fully set (media upload will fail)");
}

if (env.nodeEnv === "production" && env.jwtSecret === "dev-quantacus-jwt-secret-change-in-production") {
  console.warn("Warning: JWT_SECRET should be set in production");
}

export default env;
