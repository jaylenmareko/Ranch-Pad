import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import path from "path";
import router from "./routes/index.js";
import { db, ranchesTable, usersTable, ranchUsersTable } from "@workspace/db";
import { eq, sql, inArray } from "drizzle-orm";

const app: Express = express();

app.use(cors());
// Raw body for webhook verification (before JSON parser)
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// TEMPORARY — remove after use
app.post("/admin/reset-trial-xK9mP2qR7v", async (req: Request, res: Response): Promise<void> => {
  const { secret } = req.body as { secret?: string };
  if (secret !== "rp-admin-2026-reset") { res.status(403).json({ error: "forbidden" }); return; }

  const results: Record<string, unknown> = {};

  // 1. Reset trial for marekodavis@gmail.com
  try {
    const [u] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, "marekodavis@gmail.com")).limit(1);
    if (u) {
      const [ru] = await db.select({ ranchId: ranchUsersTable.ranchId }).from(ranchUsersTable).where(eq(ranchUsersTable.userId, u.id)).limit(1);
      if (ru) {
        const [updated] = await db.update(ranchesTable)
          .set({ trialEndsAt: sql`NOW() + INTERVAL '14 days'`, subscriptionStatus: null })
          .where(eq(ranchesTable.id, ru.ranchId))
          .returning({ id: ranchesTable.id, trialEndsAt: ranchesTable.trialEndsAt });
        results["trial_reset"] = { ok: true, ranchId: updated.id, trialEndsAt: updated.trialEndsAt };
      }
    }
  } catch (e) { results["trial_reset"] = { error: String(e) }; }

  // 2. Delete accounts
  const emailsToDelete = [
    "marekodavis@gmail.com",
    "emmajgarrison@icloud.com",
    "j7beatss@gmail.com",
    "jaylen3282004@gmail.com",
  ];

  for (const email of emailsToDelete) {
    try {
      const [u] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (!u) { results[email] = "not found"; continue; }

      // Find owned ranches
      const ownedRanches = await db.select({ ranchId: ranchUsersTable.ranchId })
        .from(ranchUsersTable)
        .where(eq(ranchUsersTable.userId, u.id));
      const ranchIds = ownedRanches.map(r => r.ranchId);

      // Delete all ranch data via raw SQL cascade
      if (ranchIds.length > 0) {
        for (const ranchId of ranchIds) {
          await db.execute(sql`DELETE FROM animal_assignments WHERE ranch_id = ${ranchId}`);
          await db.execute(sql`DELETE FROM famacha_scores WHERE ranch_id = ${ranchId}`);
          await db.execute(sql`DELETE FROM field_notes WHERE ranch_id = ${ranchId}`);
          await db.execute(sql`DELETE FROM medication_records WHERE ranch_id = ${ranchId}`);
          await db.execute(sql`DELETE FROM health_events WHERE ranch_id = ${ranchId}`);
          await db.execute(sql`DELETE FROM alerts WHERE ranch_id = ${ranchId}`);
          await db.execute(sql`DELETE FROM animals WHERE ranch_id = ${ranchId}`);
          await db.execute(sql`DELETE FROM team_invites WHERE ranch_id = ${ranchId}`);
          await db.execute(sql`DELETE FROM delete_requests WHERE ranch_id = ${ranchId}`);
          await db.execute(sql`DELETE FROM ranch_users WHERE ranch_id = ${ranchId}`);
          await db.execute(sql`DELETE FROM ranches WHERE id = ${ranchId}`);
        }
      }

      // Clean up user references not tied to a ranch
      await db.execute(sql`DELETE FROM team_invites WHERE created_by = ${u.id} OR used_by = ${u.id}`);
      await db.execute(sql`DELETE FROM delete_requests WHERE requested_by = ${u.id} OR reviewed_by = ${u.id}`);
      await db.execute(sql`DELETE FROM animal_assignments WHERE viewer_user_id = ${u.id}`);
      await db.execute(sql`DELETE FROM ranch_users WHERE user_id = ${u.id}`);

      // Delete user
      await db.delete(usersTable).where(eq(usersTable.id, u.id));

      results[email] = { ok: true, ranchIds };
    } catch (e) { results[email] = { error: String(e) }; }
  }

  res.json(results);
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
