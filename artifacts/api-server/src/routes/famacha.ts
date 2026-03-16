import { Router, type IRouter } from "express";
import { db, famachaScoresTable, animalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const router: IRouter = Router();

const createFamachaSchema = z.object({
  score: z.number().int().min(1).max(5),
  recordedDate: z.string().min(1),
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

router.get("/animals/:animalId/famacha", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const scores = await db
    .select()
    .from(famachaScoresTable)
    .where(eq(famachaScoresTable.animalId, animalId))
    .orderBy(famachaScoresTable.recordedDate);

  res.json(scores);
});

router.post("/animals/:animalId/famacha", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const parsed = createFamachaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const [score] = await db
    .insert(famachaScoresTable)
    .values({ ...parsed.data, animalId, ranchId })
    .returning();

  res.status(201).json(score);
});

router.delete("/animals/:animalId/famacha/:famachaId", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);
  const famachaId = parseId(req.params.famachaId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const [deleted] = await db
    .delete(famachaScoresTable)
    .where(and(eq(famachaScoresTable.id, famachaId), eq(famachaScoresTable.animalId, animalId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: true, message: "FAMACHA score not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
