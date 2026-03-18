import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(cors());
// Raw body for webhook verification (before JSON parser)
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve Vite frontend build in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../../ranchpad/dist");
  app.use(express.static(distPath));
  app.get("/*splat", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;
