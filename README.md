# Quantacus — Product Intelligence Dashboard

**Quantacus** is a full-stack product intelligence platform for e-commerce sellers. It ingests catalog data from **product videos** (OCR + frame analysis), **CSV bulk import**, or **manual entry**, then runs deterministic validation, title enhancement, description scoring, competitor pricing intelligence, and seller alerts — without relying on external LLM APIs for core logic.

| Layer | Stack |
|-------|--------|
| **Frontend** | React 19, Vite 6, Tailwind CSS, Radix UI, React Router, Axios |
| **Backend** | Node.js, Express 4, MongoDB (Mongoose) |
| **Media** | Cloudinary (video storage), FFmpeg (frame extraction), Tesseract.js (OCR) |

---

## Table of contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Repository structure](#repository-structure)
4. [Prerequisites](#prerequisites)
5. [Local setup](#local-setup)
6. [Environment variables](#environment-variables)
7. [Verify local deployment](#verify-local-deployment)
8. [API reference](#api-reference)
9. [Algorithms & business logic](#algorithms--business-logic)
   - [Video ingestion pipeline](#1-video-ingestion-pipeline)
   - [Frame extraction (FFmpeg)](#2-frame-extraction-ffmpeg)
   - [OCR (Tesseract.js)](#3-ocr-tesseractjs)
   - [AI / vision analysis (rule-based)](#4-ai--vision-analysis-rule-based)
   - [Catalog field extraction from OCR](#5-catalog-field-extraction-from-ocr)
   - [Title validation](#6-title-validation)
   - [Enhanced title generation](#7-enhanced-title-generation)
   - [Description quality scoring](#8-description-quality-scoring)
   - [Overall product quality score](#9-overall-product-quality-score)
   - [CSV parsing & validation](#10-csv-parsing--validation)
   - [Competitor pricing intelligence](#11-competitor-pricing-intelligence)
   - [Alerts](#12-alerts)
10. [Frontend application](#frontend-application)
11. [Troubleshooting](#troubleshooting)
12. [Production notes](#production-notes)

---

## Features

- **Video upload** → Cloudinary storage → async job: extract frames → OCR → structured catalog fields → validation → alerts
- **CSV bulk import** with header validation, per-row scoring, partial success (valid rows imported, invalid rows reported)
- **Manual product entry** without video or CSV
- **Product details** with OCR preview (before save) vs saved catalog (after save)
- **Deterministic title enhancement** from saved brand, category, color, size, material only (no OCR/AI text in title builder)
- **Title source toggle** — switch listing title between original and enhanced (persisted in DB)
- **Competitor pricing dashboard** — simulated marketplace prices, analytics, and pricing recommendations
- **Dashboard** — aggregate quality scores and issue severity counts
- **Jobs & alerts** pages for async processing status and seller notifications

---

## Architecture

```mermaid
flowchart TB
  subgraph Client["React Client (Vite :5173)"]
    UP[Upload Center]
    PD[Product Details]
    DASH[Dashboard]
  end

  subgraph API["Express API (:5000)"]
    R[routes/index.js]
    JP[jobProcessor]
    VAL[validationService]
    TIT[titleGenerationService]
    CSV[csvProcessingService]
    CP[competitorPricingService]
  end

  subgraph External["External services"]
    CL[Cloudinary]
    DB[(MongoDB)]
  end

  subgraph Local["Server-local processing"]
    FF[FFmpeg frames]
    OCR[Tesseract OCR]
  end

  UP -->|POST /upload-video| R
  UP -->|POST /upload-products-csv| R
  UP -->|POST /products| R
  R --> CL
  R --> JP
  JP --> FF
  FF --> OCR
  JP --> VAL
  R --> CSV
  R --> TIT
  PD -->|GET /products/:id| R
  R --> CP
  R --> DB
  JP --> DB
  DASH --> R
```

**Request flow (video):**

1. Client uploads video → `POST /api/upload-video` → Multer + Cloudinary → `Job` document created (`PENDING`).
2. `enqueueJob` runs `jobProcessor.processVideoExtractionJob` in the background (`setImmediate`).
3. Job downloads video, extracts 3 JPEG frames, runs OCR, rule-based “AI” analysis, builds product draft, validates, saves `Product`, creates `ProductIssue` + `Alert` records.
4. Client polls `GET /api/jobs/:id` until `COMPLETED`, then navigates to `/products/:productId`.

---

## Repository structure

```
Quantacus/
├── client/                 # React + Vite frontend
│   ├── public/             # favicon.svg, static assets
│   ├── src/
│   │   ├── components/     # UI, product, upload, dashboard
│   │   ├── pages/          # Dashboard, Products, Upload, etc.
│   │   ├── services/       # Axios API wrappers
│   │   └── utils/          # formatters, pricing helpers
│   └── vite.config.js      # dev proxy /api → localhost:5000
├── server/
│   ├── src/
│   │   ├── config/         # env, db, cloudinary
│   │   ├── controllers/
│   │   ├── jobs/           # jobProcessor (video pipeline)
│   │   ├── middlewares/    # upload, csv, errors
│   │   ├── models/         # Product, Job, Alert, CompetitorPrice, …
│   │   ├── routes/
│   │   ├── services/       # OCR, frames, CSV, pricing, validation
│   │   ├── utils/          # ffmpeg, ocr text, description quality
│   │   └── validators/     # titleValidator, csvValidator
│   └── temp/               # per-job video + frame files (gitignored)
├── package.json            # root scripts: install:all, dev:server, dev:client
└── README.md
```

---

## Prerequisites

Install the following before running locally:

| Requirement | Version / notes |
|-------------|-----------------|
| **Node.js** | 18.x or 20.x LTS recommended |
| **npm** | 9+ (comes with Node) |
| **MongoDB** | Atlas cluster or local `mongod` |
| **Cloudinary account** | Free tier works; needed for **video upload** only |
| **Disk space** | Temp folder `server/temp/` stores downloaded videos and frames during jobs |

> **Note:** FFmpeg and FFprobe are bundled via `ffmpeg-static` and `ffprobe-static` npm packages — you do **not** need a system FFmpeg install for frame extraction.

---

## Local setup

### 1. Clone and install dependencies

```bash
cd Quantacus
npm run install:all
```

This runs `npm install` in both `server/` and `client/`.

### 2. Configure environment

**Server** — copy and edit:

```bash
cp server/.env.example server/.env
```

**Client** — for local development (API proxied through Vite):

```bash
cp client/.env.example client/.env
```

Set in `client/.env`:

```env
VITE_API_URL=/api
```

Using `/api` lets Vite proxy requests to `http://localhost:5000` (see `client/vite.config.js`). Alternatively use `VITE_API_URL=http://localhost:5000/api` if not using the proxy.

### 3. MongoDB

- Create a database (e.g. `product-intelligence`) in [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or run MongoDB locally.
- Paste the connection string into `server/.env` as `MONGODB_URI`.

### 4. Cloudinary (video uploads)

1. Open [Cloudinary Console](https://console.cloudinary.com/) → **Programmable Media** → **API Keys**.
2. Copy **Cloud name**, **API Key**, and **API Secret** into `server/.env`.
3. Ensure `CLIENT_URL=http://localhost:5173` matches your frontend origin (CORS).

### 5. Start backend and frontend

**Terminal 1 — API:**

```bash
npm run dev:server
```

Expected log: `Server running on port 5000 (development)`

**Terminal 2 — UI:**

```bash
npm run dev:client
```

Open **http://localhost:5173**

### 6. Optional — seed sample data

```bash
npm run seed
```

---

## Environment variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | API port (default `5000`) |
| `CLIENT_URL` | Yes | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `CLOUDINARY_CLOUD_NAME` | Yes* | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes* | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes* | Cloudinary API secret |
| `MAX_FILE_SIZE_MB` | No | Max upload size (default from env config) |

\* Required for video upload; CSV and manual entry work without Cloudinary.

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL. Use `/api` locally with Vite proxy, or full URL in production |

---

## Verify local deployment

Use this checklist to confirm everything works:

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | `curl http://localhost:5000/api/health` | `{"success":true,"message":"API is running"}` |
| 2 | Open http://localhost:5173 | Dashboard loads |
| 3 | **Upload → Manual entry** → fill title, brand, category, price, MRP → Create | Redirects to product page; saved details visible |
| 4 | On product page, **Competitor pricing** section | Table with Flipkart + 6 competitors; analytics cards populated (no manual refresh required if price/MRP > 0) |
| 5 | **Enhance title** (after manual save) | Enhanced title card appears; toggle Original/Enhanced |
| 6 | **Upload → Products CSV** with valid headers | Import summary with valid/invalid row counts |
| 7 | **Upload → Product Video** (short MP4, visible text/labels) | Job completes; product created with OCR extraction table |
| 8 | **Jobs** page | Video job shows `COMPLETED` |
| 9 | **Alerts** page | Alerts from validation / pricing |

**Sample CSV headers (required):**

```csv
sku_id,product_title,brand,category,price,mrp,availability,description,color,material,size
SKU-001,Nike Air Zoom Running Shoes,Nike,Running Shoes,2999,3999,in_stock,Lightweight mesh upper for daily runs,Blue,Mesh,M
```

---

## API reference

Base URL: `http://localhost:5000/api` (or `/api` via Vite proxy)

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | API health check |

### Upload

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/upload-video` | `multipart/form-data` field `video` | Upload video to Cloudinary; returns `jobId` |
| `POST` | `/upload-products-csv` | `multipart/form-data` field `csvFile` | Parse, validate, import CSV rows |

### Jobs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/jobs` | List jobs |
| `GET` | `/jobs/:id` | Job status, progress, metadata (`productId` when done) |

### Products

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products` | List all products |
| `POST` | `/products` | Create product (manual entry JSON body) |
| `GET` | `/products/:id` | Full details + validation + competitor pricing payload |
| `PATCH` | `/products/:id` | Update catalog fields; sets `manualFieldsSaved` |
| `POST` | `/products/:id/enhance-title` | Generate enhanced title (requires manual save) |
| `PATCH` | `/products/:id/title-source` | Body: `{ "source": "original" \| "enhanced" }` |
| `GET` | `/products/:id/competitor-prices` | Raw competitor price documents |

### Competitor pricing

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/competitor-prices/refresh/:productId` | Regenerate simulated competitor prices |
| `GET` | `/competitor-prices/:productId` | Pricing payload (analytics + recommendation) |

### Dashboard & alerts

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard/quality-summary` | Aggregated quality metrics |
| `GET` | `/alerts` | List alerts |

---

## Algorithms & business logic

All scoring and enhancement described below is **deterministic** (rule-based). No OpenAI/Gemini calls are made in the current implementation. The `runAiAnalysis` step uses OCR text and filename heuristics only.

**Primary source files:**

| Concern | Location |
|---------|----------|
| Video job pipeline | `server/src/jobs/jobProcessor.js` |
| Frame extraction | `server/src/services/frameExtractionService.js`, `server/src/utils/ffmpegUtils.js` |
| OCR | `server/src/services/ocrService.js`, `server/src/utils/ocrTextUtils.js` |
| Catalog extraction | `server/src/utils/catalogFieldExtraction.js` |
| Title validation | `server/src/validators/titleValidator.js` |
| Title generation | `server/src/services/titleGenerationService.js` |
| Description quality | `server/src/utils/descriptionQuality.js` |
| Product validation | `server/src/services/validationService.js` |
| CSV | `server/src/validators/csvValidator.js`, `server/src/services/csvProcessingService.js` |
| Competitor pricing | `server/src/services/competitorPricingService.js` |

---

### 1. Video ingestion pipeline

**Entry:** `POST /api/upload-video` → `uploadController.uploadVideo` → `Job` type `VIDEO_EXTRACTION` → `enqueueJob` → `jobProcessor.processVideoExtractionJob`.

**Progress stages:**

| Progress | Stage |
|----------|--------|
| 10% | Job marked `RUNNING` |
| 30% | Frame extraction |
| 45% | OCR on all frames |
| 60% | AI / vision analysis |
| 75% | Build product + validation |
| 90% | Generate alerts |
| 100% | `COMPLETED`; `metadata.productId` set |

**Output product:**

- Draft catalog fields via `buildProductFromVideoAnalysis` (see §5).
- Initial `qualityScore` = `(filledFields / 11 catalog fields) × 100` (11 fields in `CATALOG_FIELDS`).
- `extractedAttributes.manualFieldsSaved` is **false** until user saves via PATCH — OCR view stays visible until then.
- `skuId` defaults to `PENDING-{jobId}` if not detected.

**Cleanup:** `cleanupJobTemp(jobId)` deletes `server/temp/videos/` and `server/temp/frames/` for that job in a `finally` block.

---

### 2. Frame extraction (FFmpeg)

**File:** `frameExtractionService.js`, `ffmpegUtils.js`

1. Download video from Cloudinary URL to `server/temp/videos/{jobId}.mp4`.
2. **Duration** via `ffprobe` (`getVideoDuration`).
3. Extract **3 keyframes** at **20%, 50%, and 80%** of duration (`getKeyframeTimestamps`).
4. Each frame saved as JPEG (`frame1.jpg`, `frame2.jpg`, `frame3.jpg`) at width **640px** (`-q:v 4` quality).
5. Timeouts: ffprobe 30s, per-frame extract 90s.

Frame metadata stored on product: `extractedAttributes.frameTimestamps`, `frameCount`, `duration`.

**UI frames:** `productDetailsSerializer.js` builds preview URLs via Cloudinary transformation (`getFrameImageUrl(videoPublicId, seconds)`), or falls back to 20/50/80% of duration if timestamps missing.

---

### 3. OCR (Tesseract.js)

**File:** `ocrService.js`

- Engine: **Tesseract.js** worker, language `eng`, shared worker per batch.
- Each frame: `worker.recognize(path)` with **60s timeout** per frame.
- On failure: frame marked `partial = true`, empty text, confidence `0`.

**Post-processing (`ocrTextUtils.js`):**

| Function | Logic |
|----------|--------|
| `cleanOcrText` | Strip garbage symbols, normalize whitespace, dedupe lines |
| `deduplicateWords` | Remove consecutive duplicate words (case-insensitive) |
| `mergeFrameTexts` | Merge all frame texts; dedupe lines globally |
| `detectBrandNames` | Regex: capitalized tokens 2+ chars; filter packaging noise |
| `detectPackagingKeywords` | Match list: NEW, SALE, OFF, LIMITED, ORGANIC, etc. |

**Aggregates:**

- `combinedText` — merged deduplicated text across successful frames.
- `overallConfidence` — arithmetic mean of per-frame Tesseract confidence scores.
- `partial` — true if any frame failed or file missing.

---

### 4. AI / vision analysis (rule-based)

**File:** `videoAnalysis.js` — `runAiAnalysis`

This is **not** a neural vision API. It structures OCR results:

- `suggestedCategory`: regex on OCR + filename → `Apparel`, `Electronics`, or `General`.
- `suggestedBrand`: first entry from `detectedBrands`.
- `packagingKeywords`: from OCR utils.
- `frameInsights`: per-frame OCR snippet + confidence.
- `confidence`: `min(0.95, overallConfidence / 100)`.

Designed as a swap-in point for OpenAI Vision / Gemini later.

---

### 5. Catalog field extraction from OCR

**File:** `catalogFieldExtraction.js` — `extractCatalogFieldsFromOcr`

Regex and heuristic extraction from `combinedText`:

| Field | Detection method |
|-------|------------------|
| `skuId` | `SKU-XXXX` in text or filename |
| `title` | First substantial line (>8 chars, not SKU/URL); else filename (title-cased) |
| `description` | First 3 lines joined (max 500 chars) |
| `brand` | OCR `detectedBrands[0]` or `suggestedBrand` |
| `category` | AI suggestion if not General; else apparel/electronics keyword match |
| `price` | `₹` / `Rs` / `INR` amount pattern |
| `mrp` | `MRP:` followed by currency amount |
| `availability` | `out of stock`, `limited`, `in stock` phrases |
| `color` | Named colors (black, white, red, …) |
| `size` | XXS–XXXL or numeric cm/inch |
| `material` | cotton, polyester, leather, mesh, etc. |

Only fields with successful matches are added to `filledFields`. Missing fields tracked via `getMissingCatalogFields`.

---

### 6. Title validation

**File:** `validators/titleValidator.js` — `validateTitle(title, { brand, category, productType })`

Starts at **score = 100**, subtracts penalties, clamps 0–100. **`isWeak`** if score **< 60**.

| Rule | Penalty | Issue message |
|------|---------|---------------|
| Length < 15 chars OR < 3 words | −30 | Title is too short |
| Brand provided but not substring of title | −20 | Missing brand information |
| Category/type provided but not in title | −25 | Lacks product type information |
| Any word repeated | −15 | Contains repeated words |
| Generic terms ≥50% of words, or ≥2 generic in ≤3 words | −20 | Lacks meaningful product information |

**Generic terms:** `best`, `awesome`, `premium`, `amazing`, `product`, `item`.

Used in: `validationService`, CSV row validation, and post-generation check on enhanced titles.

---

### 7. Enhanced title generation

**File:** `titleGenerationService.js` — `generateEnhancedTitle(product)`

**Input policy:** Only **saved** product document fields (`brand`, `color`, `category`, `size`, `material`, `title`). Ignores `extractedAttributes` OCR/AI. Placeholder titles (`Pending Review`, `extracted product`) treated as empty.

**Assembly order (`buildTitleParts`):**

1. Brand (title case)
2. Color (title case)
3. Category (title case)
4. Size → `Size {value}` or `Size M` formatting
5. Material → phrase map (`mesh` → `with Mesh Upper`, `cotton` → `Made from Cotton`, …) via `formatMaterialPhrase`

Parts joined with spaces → `dedupeWords` → `truncateTitle(..., 90)`.

**Fallback** if no parts: `Brand + Category`, or brand alone, or category alone, or original title, or `"Generic Product"`.

**Keywords (`generateKeywords`):** Up to 8 tokens/phrases from category, color+category, material, size+category, brand (min length 3; filters stop words).

**Gate:** `POST /products/:id/enhance-title` requires `extractedAttributes.manualFieldsSaved === true`.

**Title toggle:** `PATCH /products/:id/title-source` swaps `product.title` between `savedOriginalTitle` and `enhancedTitle`.

---

### 8. Description quality scoring

**File:** `descriptionQuality.js` — `analyzeDescriptionQuality(description)`

Starts at **100**. **`isWeak`** if score **< 60**.

| Rule | Penalty | Issue |
|------|---------|-------|
| Normalized length < 30 | −30 | Description is too short |
| Word count < 8 | −20 | Lacks sufficient detail |
| Any word appears > 4 times | −15 | Excessive repeated words |
| ≥2 fluff words | −15 | Generic marketing terms |

**Fluff words:** `best`, `awesome`, `amazing`, `premium`.

---

### 9. Overall product quality score

**File:** `validationService.js` — `validateProduct(product)`

Starts at **100**. Applies penalties (clamped 0–100):

| Check | Penalty (typical) | Severity |
|-------|-------------------|----------|
| Description quality | `(100 - descScore) × 0.25` | — |
| Missing title essential (title, brand, category) | −12 each | HIGH |
| Missing/placeholder title | −15 | HIGH |
| Weak title (validator) | `(100 - titleScore) × 0.2` | MEDIUM |
| Weak description | issues only | LOW |
| Missing description | −15 | MEDIUM |
| Invalid/missing price | −15 | HIGH |
| Price > MRP | −10 | MEDIUM |
| Missing media (no video/image public ID) | −12 | HIGH |
| Duplicate SKU (DB lookup) | −20 | HIGH |
| ≥2 of color/size/material missing | −10 | MEDIUM |
| `out_of_stock` availability | −5 | MEDIUM |

**`valid`:** no HIGH-severity issues.

**CSV row score:** `applyPenalties` — HIGH −25, MEDIUM −10, LOW −5 per issue. Import quality = average of row validation score and enhanced title validation score.

**Partial OCR:** `validateExtractedProduct` subtracts 5 if `ocrOutput.partial`.

---

### 10. CSV parsing & validation

**Files:** `csvProcessingService.js`, `csvValidator.js`, `constants/csvFields.js`

**Required headers:** `sku_id`, `product_title`, `brand`, `category`, `price`, `mrp`, `availability`

**Optional:** `description`, `color`, `material`, `size` (`image_url` accepted in constants but not mapped to Product)

**Header normalization:** lowercase, trim, spaces → underscores.

**Per-row validation (`validateProductRow`):**

- SKU required; duplicate within file; duplicate in DB (pre-query all SKUs in file).
- Title required; `validateTitle` if present.
- `price` and `mrp` must be > 0; `mrp >= price`.
- Brand missing → MEDIUM issue.
- Description → `analyzeDescriptionQuality` if present.
- Availability normalized: `in stock` → `in_stock`, etc.
- **Valid row:** no HIGH-severity issues.

**Import:** Valid rows → `Product.create` with `manualFieldsSaved: true`, `generateEnhancedTitle`, stored `enhancedTitle` + `suggestedKeywords`. Invalid rows skipped; summary returns per-row issues (partial success).

---

### 11. Competitor pricing intelligence

**File:** `competitorPricingService.js`

**Simulated competitors:** Amazon, Myntra, Ajio, Nykaa Fashion, Tata Cliq, Meesho. Each has a **min/max % variance** relative to product **MRP** (or price if MRP missing).

**Seeded pseudo-random variance:**

```
seed = "{productId}:{platform}:{refreshToken}"
hash → unit ∈ [0, 1)
variancePct = minPct + unit × (maxPct - minPct)
competitorPrice = round(max(1, MRP × (1 + variancePct)))
```

Same product + platform + refresh token → same price (deterministic).

**Flipkart row:** Your listing **selling price** (`price`, else MRP).

**Per competitor row:**

- `priceDifference` = Flipkart price − competitor price  
- `percentageDifference` = `(priceDifference / competitorPrice) × 100`

**Analytics (`calculatePriceAnalytics`):**

- Lowest / highest / average competitor price  
- `priceGap` = Flipkart − lowest competitor  
- `% vs lowest` = `(priceGap / lowest) × 100`

**Recommendation (`generatePriceRecommendation`):**

| Condition | Severity | Message |
|-----------|----------|---------|
| Missing pricing | LOW | Pricing data incomplete |
| Flipkart > 1.1 × lowest competitor | HIGH | Reduce price to remain competitive |
| Flipkart < 0.9 × lowest | MEDIUM | Margin opportunity |
| Within 5% of average OR ≤10% vs lowest | LOW | Competitively priced |
| Flipkart > average (else) | MEDIUM | Above market average |

**Auto-generation:** On `GET /products/:id`, if no `CompetitorPrice` records exist but `hasProductPricing(product)` (price or MRP > 0), `refreshCompetitorPrices` runs once. Frontend also bootstraps if analytics are empty.

**Refresh:** `POST /competitor-prices/refresh/:productId` deletes old records, inserts new, updates pricing alerts.

---

### 12. Alerts

**Validation alerts:** `alertGenerationService.generateAlertsFromValidation` — one `Alert` per validation issue after video extraction.

**Pricing alerts:** `generatePricingAlerts` — replaces prior pricing-related alerts for the product, inserts recommendation message.

**Severity enum:** `HIGH`, `MEDIUM`, `LOW` (`server/src/utils/enums.js`).

---

## Frontend application

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Quality summary chart/cards |
| `/products` | Products | Sortable product table |
| `/products/:id` | Product details | Catalog, edit dialog, title enhancement, competitor pricing |
| `/upload` | Upload center | Video, CSV, manual entry |
| `/jobs` | Jobs | Async job status |
| `/alerts` | Alerts | Seller notifications |

**Product details UX:**

- Before `manualFieldsSaved`: show **OCR extraction table** with confidence.
- After save: show **saved product data** only; edit via dialog.
- **Competitor pricing** enabled when `hasPricing` (price or MRP > 0 on saved product).

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `MONGODB_URI is not set` | Create `server/.env` from `.env.example` |
| CORS errors | Match `CLIENT_URL` in server `.env` to frontend URL |
| Video upload fails | Verify Cloudinary credentials; check `MAX_FILE_SIZE_MB` |
| Job stuck / failed | Open **Jobs** page; check server logs for `[frames]`, `[ocr]`, `[Job]` |
| OCR empty | Use video with clear on-screen text; ensure frames downloaded (Cloudinary URL reachable) |
| Competitor section empty | Set **Price** or **MRP** > 0 and save product details |
| CSV “missing headers” | Use exact required column names (case-insensitive, spaces → `_`) |
| Port in use | Change `PORT` in `server/.env` and Vite proxy target in `vite.config.js` |

**Logs:** Server logs prefixed with `[frames]`, `[ocr]`, `[ai]`, `[alerts]`, `[pricing]`, `[Job]`.

---

## Production notes

- Set `NODE_ENV=production`, strong `MONGODB_URI`, and production `CLIENT_URL` / `VITE_API_URL`.
- Replace `enqueueJob` (`setImmediate`) with a durable queue (**BullMQ**, Redis) for reliability.
- Cloudinary temp downloads require outbound network from API server.
- Run `npm run build:client` and serve `client/dist` behind nginx or static host; point `VITE_API_URL` to public API.
- Consider rate limits on upload endpoints and virus scanning for user videos.
- `runAiAnalysis` can be replaced with a real vision API without changing the rest of the pipeline interface.

---

## License

This project is provided for educational and portfolio use. Add your license terms here if open-sourcing.

---

**Quantacus** — deterministic catalog intelligence for marketplace sellers.
