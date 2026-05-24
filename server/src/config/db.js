import mongoose from "mongoose";
import { Product } from "../models/Product.js";

export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
    await syncProductIndexes();
  } catch (err) {
    if (err.code === 8000 || err.codeName === "AtlasError") {
      console.error(
        "\nMongoDB auth failed. Fix server/.env MONGODB_URI:\n" +
          "  1. Atlas → Database Access → confirm user exists / reset password\n" +
          "  2. Atlas → Connect → Drivers → copy a fresh connection string\n" +
          "  3. URL-encode special characters in the password (@ # % etc.)\n" +
          "  4. Add a database name, e.g. ...mongodb.net/product-intelligence?...\n"
      );
    }
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

async function syncProductIndexes() {
  try {
    const collection = mongoose.connection.collection("products");
    const indexes = await collection.indexes();

    for (const index of indexes) {
      const keys = index.key || {};
      const isLegacySkuOnly = keys.skuId === 1 && keys.createdBy === undefined && index.unique;
      if (isLegacySkuOnly && index.name !== "_id_") {
        await collection.dropIndex(index.name);
        console.log(`[db] Dropped legacy global SKU index: ${index.name}`);
      }
    }

    await Product.syncIndexes();
  } catch (err) {
    console.warn("[db] Product index sync warning:", err.message);
  }
}
