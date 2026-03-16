import { Router, type IRouter } from "express";
import { db, healthEventsTable, animalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const router: IRouter = Router();

const createHealthEventSchema = z.object({
  description: z.string().min(1),
  eventDate: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
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

router.get("/animals/:animalId/health-events", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const events = await db
    .select()
    .from(healthEventsTable)
    .where(eq(healthEventsTable.animalId, animalId))
    .orderBy(healthEventsTable.eventDate);

  res.json(events);
});

router.post("/animals/:animalId/health-events", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const parsed = createHealthEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const [event] = await db
    .insert(healthEventsTable)
    .values({ ...parsed.data, animalId, ranchId })
    .returning();

  res.status(201).json(event);
});

router.put("/animals/:animalId/health-events/:healthEventId", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);
  const healthEventId = parseId(req.params.healthEventId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const parsed = createHealthEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const [event] = await db
    .update(healthEventsTable)
    .set(parsed.data)
    .where(and(eq(healthEventsTable.id, healthEventId), eq(healthEventsTable.animalId, animalId)))
    .returning();

  if (!event) {
    res.status(404).json({ error: true, message: "Health event not found" });
    return;
  }

  res.json(event);
});

router.delete("/animals/:animalId/health-events/:healthEventId", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);
  const healthEventId = parseId(req.params.healthEventId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const [deleted] = await db
    .delete(healthEventsTable)
    .where(and(eq(healthEventsTable.id, healthEventId), eq(healthEventsTable.animalId, animalId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: true, message: "Health event not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
