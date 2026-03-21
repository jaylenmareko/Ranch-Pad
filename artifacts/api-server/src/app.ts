import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes/index.js";

const app: Express = express();

app.use(cors());
// Raw body for webhook verification (before JSON parser)
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve Vite frontend build in production.
// The production server is started from the workspace root:
//   node artifacts/api-server/dist/index.cjs
// so process.cwd() == /home/runner/workspace, making this path correct.
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(process.cwd(), "artifacts/ranchpad/dist");
  app.use(express.static(distPath));
  app.get("/*splat", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;
