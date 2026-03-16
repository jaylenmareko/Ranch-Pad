import { Router, type IRouter } from "express";
import { db, medicationRecordsTable, animalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const router: IRouter = Router();

const createMedicationSchema = z.object({
  medicationName: z.string().min(1),
  dosage: z.string().nullable().optional(),
  dateGiven: z.string().min(1),
  nextDueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

function parseAnimalId(param: string | string[]): number {
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

router.get("/animals/:animalId/medications", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseAnimalId(req.params.animalId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const records = await db
    .select()
    .from(medicationRecordsTable)
    .where(eq(medicationRecordsTable.animalId, animalId))
    .orderBy(medicationRecordsTable.dateGiven);

  res.json(records);
});

router.post("/animals/:animalId/medications", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseAnimalId(req.params.animalId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const parsed = createMedicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const [record] = await db
    .insert(medicationRecordsTable)
    .values({ ...parsed.data, animalId, ranchId })
    .returning();

  res.status(201).json(record);
});

router.put("/animals/:animalId/medications/:medicationId", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseAnimalId(req.params.animalId);
  const medicationId = parseAnimalId(req.params.medicationId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const parsed = createMedicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const [record] = await db
    .update(medicationRecordsTable)
    .set(parsed.data)
    .where(and(eq(medicationRecordsTable.id, medicationId), eq(medicationRecordsTable.animalId, animalId)))
    .returning();

  if (!record) {
    res.status(404).json({ error: true, message: "Medication record not found" });
    return;
  }

  res.json(record);
});

router.delete("/animals/:animalId/medications/:medicationId", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseAnimalId(req.params.animalId);
  const medicationId = parseAnimalId(req.params.medicationId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const [deleted] = await db
    .delete(medicationRecordsTable)
    .where(and(eq(medicationRecordsTable.id, medicationId), eq(medicationRecordsTable.animalId, animalId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: true, message: "Medication record not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
