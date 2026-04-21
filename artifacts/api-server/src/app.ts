import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes/index.js";
import { db } from "./lib/db.js";
import { sql } from "drizzle-orm";

const app: Express = express();

app.use(cors());
// Raw body for webhook verification (before JSON parser)
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TEMPORARY ADMIN — remove after use
app.delete("/admin-purge-user", async (req, res) => {
  if (req.headers["x-admin-token"] !== "ranchpad-purge-2026") {
    return res.status(403).json({ error: "forbidden" });
  }
  const { email } = req.body as { email: string };
  if (!email) return res.status(400).json({ error: "email required" });
  try {
    const rows = await db.execute(sql`SELECT id FROM users WHERE email = ${email}`);
    if (rows.rows.length === 0) return res.status(404).json({ error: "not found" });
    const uid = (rows.rows[0] as { id: number }).id;
    await db.execute(sql`DELETE FROM animal_assignments WHERE viewer_user_id = ${uid}`);
    await db.execute(sql`DELETE FROM delete_requests    WHERE requested_by  = ${uid} OR reviewed_by = ${uid}`);
    await db.execute(sql`DELETE FROM team_invites       WHERE created_by    = ${uid} OR used_by     = ${uid}`);
    await db.execute(sql`DELETE FROM ranch_users        WHERE user_id       = ${uid}`);
    await db.execute(sql`DELETE FROM users              WHERE id            = ${uid}`);
    return res.json({ deleted: email, id: uid });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

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
