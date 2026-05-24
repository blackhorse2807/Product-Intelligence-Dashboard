import mongoose from "mongoose";

export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
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
