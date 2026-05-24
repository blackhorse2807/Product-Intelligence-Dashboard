import cors from "cors";
import express from "express";
import env from "./config/env.js";
import { connectDB } from "./config/db.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { startCompetitorRefreshCron } from "./jobs/competitorRefreshCron.js";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is not set in environment");
  }

  await connectDB(env.mongodbUri);

  startCompetitorRefreshCron();

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
