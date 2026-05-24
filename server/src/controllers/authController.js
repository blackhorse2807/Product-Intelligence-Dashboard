import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Job } from "../models/Job.js";
import { Alert } from "../models/Alert.js";
import { signAccessToken } from "../utils/jwt.js";
import { getUserProductIds, userProductFilter } from "../utils/ownership.js";
import env from "../config/env.js";
import { parseCloudinaryFile, deleteCloudinaryAsset } from "../services/cloudinaryService.js";

function validateCredentials({ name, email, password }) {
  if (!email?.trim() || !password) {
    const err = new Error("Email and password are required");
    err.statusCode = 400;
    throw err;
  }
  if (password.length < 6) {
    const err = new Error("Password must be at least 6 characters");
    err.statusCode = 400;
    throw err;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    const err = new Error("Invalid email address");
    err.statusCode = 400;
    throw err;
  }
  if (name !== undefined && !String(name).trim()) {
    const err = new Error("Name is required");
    err.statusCode = 400;
    throw err;
  }
}

async function buildProfilePayload(user) {
  const userId = user._id;
  const productIds = await getUserProductIds(userId);

  const [productCount, jobCount, openAlerts] = await Promise.all([
    Product.countDocuments(userProductFilter(userId)),
    Job.countDocuments({ createdBy: userId }),
    productIds.length
      ? Alert.countDocuments({ productId: { $in: productIds }, resolved: false })
      : 0,
  ]);

  return {
    user: user.toSafeObject(),
    stats: {
      productCount,
      jobCount,
      openAlerts,
    },
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  validateCredentials({ name, email, password });

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    const err = new Error("An account with this email already exists");
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  });

  const token = signAccessToken(user);
  const profile = await buildProfilePayload(user);

  return successResponse(
    res,
    { ...profile, token },
    "Account created successfully",
    201
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  validateCredentials({ email, password });

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const token = signAccessToken(user);
  const profile = await buildProfilePayload(user);

  return successResponse(res, { ...profile, token }, "Login successful");
});

export const getMe = asyncHandler(async (req, res) => {
  const profile = await buildProfilePayload(req.user);
  return successResponse(res, profile, "Profile fetched");
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name?.trim()) {
    const err = new Error("Name is required");
    err.statusCode = 400;
    throw err;
  }

  req.user.name = name.trim();
  await req.user.save();

  const profile = await buildProfilePayload(req.user);
  return successResponse(res, profile, "Profile updated");
});

export const uploadProfileAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    const err = new Error("Profile image is required (field: avatar)");
    err.statusCode = 400;
    throw err;
  }

  const media = parseCloudinaryFile(req.file);
  if (!media.url || !media.publicId) {
    const err = new Error("Image upload failed");
    err.statusCode = 500;
    throw err;
  }

  if (req.user.avatarPublicId) {
    try {
      await deleteCloudinaryAsset(req.user.avatarPublicId, "image");
    } catch (err) {
      console.warn("[auth] Old avatar delete skipped:", err.message);
    }
  }

  req.user.avatarUrl = media.url;
  req.user.avatarPublicId = media.publicId;
  await req.user.save();

  const profile = await buildProfilePayload(req.user);
  return successResponse(res, profile, "Profile picture updated");
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email?.trim()) {
    const err = new Error("Email is required");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+resetPasswordToken +resetPasswordExpires"
  );

  const genericMessage =
    "If an account exists for this email, password reset instructions have been sent.";

  if (!user) {
    return successResponse(res, { message: genericMessage }, genericMessage);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const clientBase = env.clientUrl.replace(/\/$/, "");
  const resetUrl = `${clientBase}/reset-password?token=${resetToken}`;

  console.log(`[auth] Password reset link for ${user.email}: ${resetUrl}`);

  return successResponse(
    res,
    {
      message: genericMessage,
      ...(env.nodeEnv !== "production" ? { resetUrl, resetToken } : {}),
    },
    genericMessage
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token?.trim() || !password) {
    const err = new Error("Token and new password are required");
    err.statusCode = 400;
    throw err;
  }
  if (password.length < 6) {
    const err = new Error("Password must be at least 6 characters");
    err.statusCode = 400;
    throw err;
  }

  const hashed = crypto.createHash("sha256").update(token.trim()).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+password +resetPasswordToken +resetPasswordExpires");

  if (!user) {
    const err = new Error("Invalid or expired reset token");
    err.statusCode = 400;
    throw err;
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const accessToken = signAccessToken(user);
  const profile = await buildProfilePayload(user);

  return successResponse(res, { ...profile, token: accessToken }, "Password reset successful");
});
