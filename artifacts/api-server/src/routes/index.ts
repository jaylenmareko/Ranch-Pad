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

// TEMPORARY — remove after trial reset
router.post("/admin-reset-trial-xK9mP2qR7v", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [u] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, "marekodavis@gmail.com")).limit(1);
    if (!u) { res.status(404).json({ error: "user not found" }); return; }
    const [ru] = await db.select({ ranchId: ranchUsersTable.ranchId }).from(ranchUsersTable).where(eq(ranchUsersTable.userId, u.id)).limit(1);
    if (!ru) { res.status(404).json({ error: "ranch not found" }); return; }
    const [updated] = await db.update(ranchesTable)
      .set({ trialEndsAt: sql`NOW() + INTERVAL '14 days'`, subscriptionStatus: null })
      .where(eq(ranchesTable.id, ru.ranchId))
      .returning({ id: ranchesTable.id, trialEndsAt: ranchesTable.trialEndsAt });
    res.json({ ok: true, ranchId: updated.id, trialEndsAt: updated.trialEndsAt });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
// END TEMPORARY

export default router;
