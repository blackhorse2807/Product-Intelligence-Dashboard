import { Product } from "../models/Product.js";

export function userProductFilter(userId) {
  return { createdBy: userId };
}

export async function getUserProductIds(userId) {
  const rows = await Product.find({ createdBy: userId }).select("_id").lean();
  return rows.map((p) => p._id);
}

export async function findOwnedProduct(productId, userId) {
  const product = await Product.findOne({ _id: productId, ...userProductFilter(userId) });
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  return product;
}

export function assertJobOwner(job, userId) {
  const ownerId = job.createdBy || job.metadata?.userId;
  if (!ownerId || String(ownerId) !== String(userId)) {
    const err = new Error("You do not have access to this job");
    err.statusCode = 403;
    throw err;
  }
}
