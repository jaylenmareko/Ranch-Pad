import { Router, type IRouter } from "express";
import { db, animalPhotosTable, animalsTable, healthEventsTable, medicationRecordsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, requireNotViewer } from "../middlewares/auth.js";
import { z } from "zod";

const router: IRouter = Router();

const attachPhotoSchema = z.object({
  objectPath: z.string().min(1),
  originalFilename: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
});

function parseId(param: string | string[]): number {
  return parseInt(Array.isArray(param) ? param[0] : param, 10);
}

async function verifyAnimalOwnership(animalId: number, ranchId: number) {
  const [animal] = await db
    .select()
    .from(animalsTable)
    .where(and(eq(animalsTable.id, animalId), eq(animalsTable.ranchId, ranchId)))
    .limit(1);
  return animal;
}

// ─── Health Event Photos ────────────────────────────────────────────────────

/** GET all photos for all health events of this animal (bulk, avoids N+1) */
router.get("/animals/:animalId/health-events/photos", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);

  if (!await verifyAnimalOwnership(animalId, ranchId)) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const events = await db
    .select({ id: healthEventsTable.id })
    .from(healthEventsTable)
    .where(eq(healthEventsTable.animalId, animalId));

  if (events.length === 0) { res.json({}); return; }

  const photos = await db
    .select()
    .from(animalPhotosTable)
    .where(inArray(animalPhotosTable.healthEventId, events.map(e => e.id)));

  const grouped: Record<number, typeof photos> = {};
  for (const p of photos) {
    const key = p.healthEventId!;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  res.json(grouped);
});

/** POST attach a photo to a health event */
router.post("/animals/:animalId/health-events/:eventId/photos", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);
  const eventId = parseId(req.params.eventId);

  if (!await verifyAnimalOwnership(animalId, ranchId)) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const [event] = await db
    .select({ id: healthEventsTable.id })
    .from(healthEventsTable)
    .where(and(eq(healthEventsTable.id, eventId), eq(healthEventsTable.animalId, animalId)))
    .limit(1);

  if (!event) { res.status(404).json({ error: true, message: "Health event not found" }); return; }

  const parsed = attachPhotoSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: true, message: parsed.error.message }); return; }

  const [photo] = await db
    .insert(animalPhotosTable)
    .values({ ...parsed.data, healthEventId: eventId })
    .returning();

  res.status(201).json(photo);
});

/** DELETE a photo attached to a health event */
router.delete("/animals/:animalId/health-events/:eventId/photos/:photoId", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);
  const photoId = parseId(req.params.photoId);

  if (!await verifyAnimalOwnership(animalId, ranchId)) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const [deleted] = await db
    .delete(animalPhotosTable)
    .where(eq(animalPhotosTable.id, photoId))
    .returning();

  if (!deleted) { res.status(404).json({ error: true, message: "Photo not found" }); return; }

  res.sendStatus(204);
});

// ─── Medication Record Photos ────────────────────────────────────────────────

/** GET all photos for all medication records of this animal (bulk) */
router.get("/animals/:animalId/medications/photos", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);

  if (!await verifyAnimalOwnership(animalId, ranchId)) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const meds = await db
    .select({ id: medicationRecordsTable.id })
    .from(medicationRecordsTable)
    .where(eq(medicationRecordsTable.animalId, animalId));

  if (meds.length === 0) { res.json({}); return; }

  const photos = await db
    .select()
    .from(animalPhotosTable)
    .where(inArray(animalPhotosTable.medicationRecordId, meds.map(m => m.id)));

  const grouped: Record<number, typeof photos> = {};
  for (const p of photos) {
    const key = p.medicationRecordId!;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  res.json(grouped);
});

/** POST attach a photo to a medication record */
router.post("/animals/:animalId/medications/:medId/photos", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);
  const medId = parseId(req.params.medId);

  if (!await verifyAnimalOwnership(animalId, ranchId)) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const [med] = await db
    .select({ id: medicationRecordsTable.id })
    .from(medicationRecordsTable)
    .where(and(eq(medicationRecordsTable.id, medId), eq(medicationRecordsTable.animalId, animalId)))
    .limit(1);

  if (!med) { res.status(404).json({ error: true, message: "Medication record not found" }); return; }

  const parsed = attachPhotoSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: true, message: parsed.error.message }); return; }

  const [photo] = await db
    .insert(animalPhotosTable)
    .values({ ...parsed.data, medicationRecordId: medId })
    .returning();

  res.status(201).json(photo);
});

/** DELETE a photo attached to a medication record */
router.delete("/animals/:animalId/medications/:medId/photos/:photoId", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);
  const photoId = parseId(req.params.photoId);

  if (!await verifyAnimalOwnership(animalId, ranchId)) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const [deleted] = await db
    .delete(animalPhotosTable)
    .where(eq(animalPhotosTable.id, photoId))
    .returning();

  if (!deleted) { res.status(404).json({ error: true, message: "Photo not found" }); return; }

  res.sendStatus(204);
});

export default router;
