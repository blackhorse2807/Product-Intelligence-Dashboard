import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db.js";
import { Product } from "../models/Product.js";
import { ProductIssue } from "../models/ProductIssue.js";
import { CompetitorPrice } from "../models/CompetitorPrice.js";
import { Alert } from "../models/Alert.js";
import { Job } from "../models/Job.js";
import { JOB_STATUS, JOB_TYPES, SEVERITY } from "./enums.js";

const mockProducts = [
  {
    skuId: "SKU-1001",
    title: "Wireless Noise Cancelling Headphones",
    description: "Premium over-ear headphones with 40h battery life.",
    brand: "SoundMax",
    category: "Electronics",
    price: 4999,
    mrp: 6999,
    videoUrl: "",
    videoPublicId: "",
    imagePublicId: "",
    availability: "in_stock",
    color: "Black",
    size: "One Size",
    material: "Plastic",
    extractedAttributes: { connectivity: "Bluetooth 5.3", warranty: "1 year" },
    enhancedTitle: "",
    suggestedKeywords: ["wireless", "headphones", "anc"],
    qualityScore: 72,
  },
  {
    skuId: "SKU-1002",
    title: "Organic Cotton T-Shirt",
    description: "Soft breathable tee for everyday wear.",
    brand: "EcoWear",
    category: "Apparel",
    price: 799,
    mrp: 1299,
    videoUrl: "",
    videoPublicId: "",
    imagePublicId: "",
    availability: "limited",
    color: "White",
    size: "M",
    material: "Cotton",
    extractedAttributes: { fabric: "100% organic cotton" },
    enhancedTitle: "EcoWear Organic Cotton Crew Neck T-Shirt - Soft & Breathable",
    suggestedKeywords: ["organic", "cotton", "tshirt"],
    qualityScore: 88,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");

  await connectDB(uri);

  await Promise.all([
    Product.deleteMany({}),
    ProductIssue.deleteMany({}),
    CompetitorPrice.deleteMany({}),
    Alert.deleteMany({}),
    Job.deleteMany({}),
  ]);

  const products = await Product.insertMany(mockProducts);

  await ProductIssue.insertMany([
    {
      productId: products[0]._id,
      severity: SEVERITY.MEDIUM,
      type: "MISSING_KEYWORDS",
      message: "Title lacks high-intent keywords.",
      suggestedFix: "Add brand + feature keywords to title.",
    },
    {
      productId: products[1]._id,
      severity: SEVERITY.LOW,
      type: "IMAGE_QUALITY",
      message: "Main image resolution is below recommended threshold.",
      suggestedFix: "Upload at least 1200x1200 product image.",
    },
  ]);

  await CompetitorPrice.insertMany([
    {
      productId: products[0]._id,
      platform: "Amazon",
      competitorPrice: 4799,
      competitorUrl: "https://amazon.example/item",
      lastCheckedAt: new Date(),
    },
    {
      productId: products[0]._id,
      platform: "Flipkart",
      competitorPrice: 5199,
      competitorUrl: "https://flipkart.example/item",
      lastCheckedAt: new Date(),
    },
  ]);

  await Alert.insertMany([
    {
      productId: products[0]._id,
      severity: SEVERITY.HIGH,
      message: "Competitor price is lower than your listing price.",
      resolved: false,
    },
    {
      productId: products[1]._id,
      severity: SEVERITY.LOW,
      message: "Quality score improved after title enhancement.",
      resolved: true,
    },
  ]);

  await Job.insertMany([
    {
      type: JOB_TYPES.VIDEO_EXTRACTION,
      status: JOB_STATUS.COMPLETED,
      progress: 100,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
    },
    {
      type: JOB_TYPES.CSV_IMPORT,
      status: JOB_STATUS.RUNNING,
      progress: 45,
      startedAt: new Date(),
    },
  ]);

  console.log("Seed data inserted successfully");
  await disconnectDB();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
