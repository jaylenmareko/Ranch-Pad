import { Router, type IRouter, type Request, type Response } from "express";
import { db, ranchesTable, usersTable, ranchUsersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import ranchRouter from "./ranch.js";
import animalsRouter from "./animals.js";
import medicationsRouter from "./medications.js";
import healthEventsRouter from "./health-events.js";
import famachaRouter from "./famacha.js";
import fieldNotesRouter from "./field-notes.js";
import alertsRouter from "./alerts.js";
import weatherRouter from "./weather.js";
import upcomingRouter from "./upcoming.js";
import billingRouter from "./billing.js";
import teamRouter from "./team.js";
import locationsRouter from "./locations.js";
import storageRouter from "./storage.js";
import photosRouter from "./photos.js";
import ranchNotesRouter from "./ranch-notes.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(ranchRouter);
router.use(animalsRouter);
router.use(medicationsRouter);
router.use(healthEventsRouter);
router.use(famachaRouter);
router.use(fieldNotesRouter);
router.use(alertsRouter);
router.use(weatherRouter);
router.use(upcomingRouter);
router.use(billingRouter);
router.use(teamRouter);
router.use(locationsRouter);
router.use(storageRouter);
router.use(photosRouter);
router.use(ranchNotesRouter);

// TEMPORARY — remove after account deletion
router.post("/admin-reset-trial-xK9mP2qR7v", async (_req: Request, res: Response): Promise<void> => {
  const email = "marekodavis@gmail.com";
  try {
    const [u] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!u) { res.status(404).json({ error: "user not found" }); return; }
    const ownedRanches = await db.select({ ranchId: ranchUsersTable.ranchId }).from(ranchUsersTable).where(eq(ranchUsersTable.userId, u.id));
    for (const { ranchId } of ownedRanches) {
      await db.execute(sql`DELETE FROM animal_assignments WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM famacha_scores WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM field_notes WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM medication_records WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM health_events WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM alerts WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM animals WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM team_invites WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM delete_requests WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM ranch_notes WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM pasture_locations WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM ranch_users WHERE ranch_id = ${ranchId}`);
      await db.execute(sql`DELETE FROM ranches WHERE id = ${ranchId}`);
    }
    await db.execute(sql`DELETE FROM team_invites WHERE created_by = ${u.id} OR used_by = ${u.id}`);
    await db.execute(sql`DELETE FROM delete_requests WHERE requested_by = ${u.id} OR reviewed_by = ${u.id}`);
    await db.execute(sql`DELETE FROM animal_assignments WHERE viewer_user_id = ${u.id}`);
    await db.execute(sql`DELETE FROM ranch_users WHERE user_id = ${u.id}`);
    await db.delete(usersTable).where(eq(usersTable.id, u.id));
    res.json({ ok: true, deleted: email, ranchIds: ownedRanches.map(r => r.ranchId) });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
// END TEMPORARY

export default router;
