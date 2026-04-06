import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import path from "path";
import router from "./routes/index.js";
import { db, ranchesTable, usersTable, ranchUsersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const app: Express = express();

app.use(cors());
// Raw body for webhook verification (before JSON parser)
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// TEMPORARY — remove after trial reset
app.post("/admin/reset-trial-xK9mP2qR7v", async (req: Request, res: Response): Promise<void> => {
  const { email, secret } = req.body as { email?: string; secret?: string };
  if (secret !== "rp-admin-2026-reset") { res.status(403).json({ error: "forbidden" }); return; }
  if (!email) { res.status(400).json({ error: "email required" }); return; }
  try {
    const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) { res.status(404).json({ error: "user not found" }); return; }
    const [ru] = await db.select({ ranchId: ranchUsersTable.ranchId }).from(ranchUsersTable).where(eq(ranchUsersTable.userId, user.id)).limit(1);
    if (!ru) { res.status(404).json({ error: "ranch not found" }); return; }
    const [updated] = await db.update(ranchesTable)
      .set({ trialEndsAt: sql`NOW() + INTERVAL '14 days'`, subscriptionStatus: null })
      .where(eq(ranchesTable.id, ru.ranchId))
      .returning({ id: ranchesTable.id, trialEndsAt: ranchesTable.trialEndsAt });
    res.json({ ok: true, ranchId: updated.id, trialEndsAt: updated.trialEndsAt });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
// END TEMPORARY

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
