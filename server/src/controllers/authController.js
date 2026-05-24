import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { User } from "../models/User.js";
import { signAccessToken } from "../utils/jwt.js";

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

  return successResponse(
    res,
    { user: user.toSafeObject(), token },
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

  return successResponse(res, { user: user.toSafeObject(), token }, "Login successful");
});

export const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, { user: req.user.toSafeObject() }, "Profile fetched");
});
