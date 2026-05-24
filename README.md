# Product Intelligence Dashboard for E-commerce Sellers

Production-grade MERN starter for an internship assignment. JavaScript only — scalable architecture with placeholder controllers (no business logic yet).

## Tech Stack

| Layer | Stack |
|-------|--------|
| Frontend | React, Vite, Tailwind CSS, shadcn/ui-style components, React Router, Axios, TanStack Table, Recharts, Lucide |
| Backend | Node.js, Express, MongoDB, Mongoose, Multer, Cloudinary, dotenv, cors |
| Media | Cloudinary (videos, images, CSV raw files) |
| Deploy | Vercel (client), Render/Railway (server), MongoDB Atlas (DB) |

## Project Structure

```
product-intelligence-dashboard/
├── client/                 # React + Vite dashboard
│   └── src/
│       ├── components/     # ui, dashboard, tables, upload, alerts, layout
│       ├── pages/
│       ├── services/       # Axios API layer
│       ├── hooks/
│       ├── layouts/
│       ├── routes/
│       ├── context/
│       └── constants/
├── server/                 # Express API
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── models/
│       ├── middlewares/
│       ├── services/
│       ├── validators/
│       ├── jobs/
│       ├── utils/
│       └── config/
└── README.md
```

## Setup Commands

### 1. Install dependencies

```bash
npm run install:all
```

Or manually:

```bash
cd server && npm install
cd ../client && npm install
```

**Server media dependencies:**

```bash
cd server
npm install cloudinary multer multer-storage-cloudinary
```

### 2. Environment variables

**Server** — copy `server/.env.example` to `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/product-intelligence
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE_MB=50

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Get Cloudinary keys from [console.cloudinary.com](https://console.cloudinary.com/settings/api-keys).

Videos upload to folder `quantacus/videos`, CSV files to `quantacus/csv`.

**Client** — copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

For **MongoDB Atlas**, replace `MONGODB_URI` with your Atlas connection string.

### 3. Seed mock data (optional)

```bash
npm run seed
```

### 4. Run development servers

Terminal 1 — API:

```bash
npm run dev:server
```

Terminal 2 — Frontend:

```bash
npm run dev:client
```

- Frontend: http://localhost:5173  
- API: http://localhost:5000/api/health  

## Media Architecture (Cloudinary + MongoDB)

This project uses a **split storage model** — the production pattern for media-heavy apps.

```
Frontend Upload
      ↓
Express API (Multer)
      ↓
multer-storage-cloudinary → Cloudinary CDN
      ↓
secure_url + public_id returned
      ↓
MongoDB stores references only (Job → Product)
      ↓
jobProcessor uses videoUrl for simulated extraction
```

### Why Cloudinary?

| Benefit | Description |
|---------|-------------|
| CDN delivery | Fast global video/image delivery |
| Transformations | Thumbnails/posters without storing duplicates |
| Scalability | No disk limits on Render/Railway |
| Cost control | Pay for storage/bandwidth, not server RAM |

### Why MongoDB stores only metadata?

MongoDB is optimized for **structured business data**, not binary blobs. Storing videos in MongoDB would:

- Bloat database size and slow backups
- Hit the 16MB document limit
- Increase API latency

MongoDB stores: `videoUrl`, `videoPublicId`, `imageUrl`, `imagePublicId`, SKU, pricing, quality scores, job state.

Cloudinary stores: actual `.mp4` / `.mov` / `.avi` files and CSV raw uploads.

### Upload flow

1. `POST /api/upload-video` — field name `video`
2. Multer streams file to Cloudinary (`quantacus/videos`)
3. Job created with Cloudinary URLs in `metadata` (no buffers)
4. `jobProcessor` simulates AI extraction using filename + `videoUrl`
5. Product document created with media references only

### Cleanup helper

```js
import { deleteCloudinaryAsset } from "./services/cloudinaryService.js";
await deleteCloudinaryAsset(publicId, "video");
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload-video` | Upload product video |
| POST | `/api/upload-products-csv` | Upload fallback CSV |
| GET | `/api/jobs` | List async jobs |
| GET | `/api/jobs/:id` | Get job by ID |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Product details |
| GET | `/api/products/:id/competitor-prices` | Competitor pricing |
| POST | `/api/products/:id/enhance-title` | Queue title enhancement |
| GET | `/api/dashboard/quality-summary` | Dashboard metrics |
| GET | `/api/alerts` | List alerts |
| POST | `/api/competitor-prices/refresh` | Refresh competitor prices |

## Mongoose Models

- **Product** — catalog + quality + enhanced title fields  
- **ProductIssue** — validation findings  
- **CompetitorPrice** — cross-platform pricing  
- **Alert** — seller notifications  
- **Job** — async processing tracker  

### Enums

**Job status:** `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `PARTIALLY_COMPLETED`  
**Severity:** `HIGH`, `MEDIUM`, `LOW`

## shadcn/ui (JavaScript)

`components.json` is configured for JS. Add more components later:

```bash
cd client
npx shadcn@latest add dialog dropdown-menu
```

## Deployment

### Frontend → Vercel

1. Set root directory to `client`
2. Build command: `npm run build`
3. Output: `dist`
4. Env: `VITE_API_URL=https://your-api.onrender.com/api`

### Backend → Render / Railway

1. Root: `server`
2. Start: `npm start`
3. Env: `MONGODB_URI`, `CLIENT_URL`, `PORT`

### Database → MongoDB Atlas

1. Create free cluster  
2. Add database user + IP whitelist  
3. Use connection string in `MONGODB_URI`

## CSV product import

Bulk import via `POST /api/upload-products-csv` (multipart field: `csvFile`).

**Required headers:** `sku_id`, `product_title`, `brand`, `category`, `price`, `mrp`, `availability`  
**Optional:** `description`, `color`, `material`, `size`

- Parses with `csv-parser`, validates headers and each row
- **Partial success:** valid rows are stored; invalid rows are reported
- Generates enhanced title + keywords for each imported product
- Returns validation summary with issue breakdown (HIGH / MEDIUM / LOW)

```bash
cd server
npm install multer csv-parser
```

## Competitor pricing (simulated)

Competitor prices are **simulated using controlled pricing variance logic** for demonstration purposes. No scraping or external APIs are used.

- **Our platform:** Flipkart (your listing `price` vs competitor MRP-based estimates)
- **Competitors:** Amazon, Myntra, Ajio, Nykaa Fashion, Tata Cliq, Meesho
- **Generation:** Each platform applies a defined % variance band on product **MRP** (e.g. Amazon −10% to +10%, Meesho −20% to 0%)
- **Refresh:** `POST /api/competitor-prices/refresh/:productId` regenerates prices and analytics
- **Analytics:** lowest/highest/average competitor price, price gap, % difference vs lowest
- **Recommendations:** deterministic rules (reduce price / competitively priced / margin opportunity)
- **Alerts:** pricing alerts created on refresh

## Next Steps (Implementation)

1. Replace simulated extraction with real AI/vision API using `videoUrl`  
2. Parse CSV from Cloudinary `csvUrl` (fetch + csv-parse)  
3. Listing quality validation engine  
4. Title enhancement + keyword suggestions  
5. Competitor price scraper/mock refresh  
6. Bull/BullMQ queue instead of `setImmediate` job runner  
7. Real-time job progress (SSE/WebSockets)

## License

MIT — internship/educational use.
