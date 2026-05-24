import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { ProductIssue } from "../models/ProductIssue.js";
import { CompetitorPrice } from "../models/CompetitorPrice.js";
import { Alert } from "../models/Alert.js";
import { Job } from "../models/Job.js";
import { JOB_STATUS, JOB_TYPES, SEVERITY } from "./enums.js";

const DEMO_EMAIL = "demo@quantacus.local";
const DEMO_PASSWORD = "demo123";

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
    extractedAttributes: { connectivity: "Bluetooth 5.3", warranty: "1 year", manualFieldsSaved: true },
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
    extractedAttributes: { fabric: "100% organic cotton", manualFieldsSaved: true },
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
    User.deleteMany({}),
    Product.deleteMany({}),
    ProductIssue.deleteMany({}),
    CompetitorPrice.deleteMany({}),
    Alert.deleteMany({}),
    Job.deleteMany({}),
  ]);

  const demoUser = await User.create({
    name: "Demo Seller",
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  const products = await Product.insertMany(
    mockProducts.map((product) => ({ ...product, createdBy: demoUser._id }))
  );

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
      priceDifference: 200,
      percentageDifference: 4.2,
      lastCheckedAt: new Date(),
    },
    {
      productId: products[0]._id,
      platform: "Myntra",
      competitorPrice: 5199,
      priceDifference: -200,
      percentageDifference: -3.8,
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
      createdBy: demoUser._id,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
    },
    {
      type: JOB_TYPES.CSV_IMPORT,
      status: JOB_STATUS.RUNNING,
      progress: 45,
      createdBy: demoUser._id,
      startedAt: new Date(),
    },
  ]);

  console.log("Seed data inserted successfully");
  console.log(`Demo login — email: ${DEMO_EMAIL}  password: ${DEMO_PASSWORD}`);
  await disconnectDB();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
