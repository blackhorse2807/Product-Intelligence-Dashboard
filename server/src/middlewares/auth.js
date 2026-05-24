import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      const err = new Error("Authentication required");
      err.statusCode = 401;
      throw err;
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 401;
      throw err;
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      err.statusCode = 401;
      err.message = "Invalid or expired token";
    }
    next(err);
  }
}
