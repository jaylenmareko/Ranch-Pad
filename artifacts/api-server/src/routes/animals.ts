import { Router, type IRouter } from "express";
import { db, animalsTable, healthEventsTable } from "@workspace/db";
import { eq, and, or, ilike, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const router: IRouter = Router();

const createAnimalSchema = z.object({
  name: z.string().min(1),
  tagNumber: z.string().nullable().optional(),
  species: z.string().min(1),
  breed: z.string().nullable().optional(),
  sex: z.string().min(1),
  dateOfBirth: z.string().nullable().optional(),
  damId: z.number().int().nullable().optional(),
  sireId: z.number().int().nullable().optional(),
  expectedDueDate: z.string().nullable().optional(),
});

// Compute health dot color from events in last 7 days
async function getLatestHealthSeverity(animalId: number, ranchId: number): Promise<string | null> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const events = await db
    .select()
    .from(healthEventsTable)
    .where(
      and(
        eq(healthEventsTable.animalId, animalId),
        eq(healthEventsTable.ranchId, ranchId),
      )
    );

  const recent = events.filter(e => e.eventDate >= sevenDaysAgoStr);
  if (recent.length === 0) return null;
  if (recent.some(e => e.severity === "high")) return "high";
  if (recent.some(e => e.severity === "medium")) return "medium";
  return "low";
}

router.get("/animals", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const { species, sex, breed, search } = req.query as Record<string, string>;

  let animals = await db
    .select()
    .from(animalsTable)
    .where(eq(animalsTable.ranchId, ranchId))
    .orderBy(animalsTable.createdAt);

  // Filter in-memory for flexibility
  if (species) animals = animals.filter(a => a.species.toLowerCase() === species.toLowerCase());
  if (sex) animals = animals.filter(a => a.sex.toLowerCase() === sex.toLowerCase());
  if (breed) animals = animals.filter(a => a.breed?.toLowerCase().includes(breed.toLowerCase()));
  if (search) {
    const s = search.toLowerCase();
    animals = animals.filter(a =>
      a.name.toLowerCase().includes(s) ||
      a.tagNumber?.toLowerCase().includes(s) ||
      a.breed?.toLowerCase().includes(s)
    );
  }

  const result = await Promise.all(
    animals.map(async animal => ({
      ...animal,
      latestHealthSeverity: await getLatestHealthSeverity(animal.id, ranchId),
    }))
  );

  res.json(result);
});

async function validateLineageOwnership(damId: number | null | undefined, sireId: number | null | undefined, ranchId: number): Promise<string | null> {
  if (damId) {
    const [dam] = await db.select({ id: animalsTable.id }).from(animalsTable).where(and(eq(animalsTable.id, damId), eq(animalsTable.ranchId, ranchId))).limit(1);
    if (!dam) return `Dam with id ${damId} not found in this ranch`;
  }
  if (sireId) {
    const [sire] = await db.select({ id: animalsTable.id }).from(animalsTable).where(and(eq(animalsTable.id, sireId), eq(animalsTable.ranchId, ranchId))).limit(1);
    if (!sire) return `Sire with id ${sireId} not found in this ranch`;
  }
  return null;
}

router.post("/animals", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const parsed = createAnimalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const lineageError = await validateLineageOwnership(parsed.data.damId, parsed.data.sireId, ranchId);
  if (lineageError) {
    res.status(400).json({ error: true, message: lineageError });
    return;
  }

  const [animal] = await db
    .insert(animalsTable)
    .values({ ...parsed.data, ranchId })
    .returning();

  res.status(201).json({ ...animal, latestHealthSeverity: null });
});

router.get("/animals/:animalId", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const raw = Array.isArray(req.params.animalId) ? req.params.animalId[0] : req.params.animalId;
  const animalId = parseInt(raw, 10);

  const [animal] = await db
    .select()
    .from(animalsTable)
    .where(and(eq(animalsTable.id, animalId), eq(animalsTable.ranchId, ranchId)))
    .limit(1);

  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  // Get dam, sire, babies
  let dam = null;
  let sire = null;

  if (animal.damId) {
    const [d] = await db.select().from(animalsTable).where(and(eq(animalsTable.id, animal.damId), eq(animalsTable.ranchId, ranchId))).limit(1);
    if (d) dam = { id: d.id, name: d.name, tagNumber: d.tagNumber, species: d.species };
  }

  if (animal.sireId) {
    const [s] = await db.select().from(animalsTable).where(and(eq(animalsTable.id, animal.sireId), eq(animalsTable.ranchId, ranchId))).limit(1);
    if (s) sire = { id: s.id, name: s.name, tagNumber: s.tagNumber, species: s.species };
  }

  // Find babies (animals where dam_id or sire_id = this animal's id)
  const babyRows = await db
    .select()
    .from(animalsTable)
    .where(
      and(
        eq(animalsTable.ranchId, ranchId),
        or(eq(animalsTable.damId, animalId), eq(animalsTable.sireId, animalId))
      )
    );

  const babies = babyRows.map(b => ({
    id: b.id,
    name: b.name,
    tagNumber: b.tagNumber,
    species: b.species,
  }));

  const latestHealthSeverity = await getLatestHealthSeverity(animalId, ranchId);

  res.json({ ...animal, dam, sire, babies, latestHealthSeverity });
});

router.put("/animals/:animalId", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const raw = Array.isArray(req.params.animalId) ? req.params.animalId[0] : req.params.animalId;
  const animalId = parseInt(raw, 10);

  const parsed = createAnimalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const lineageError = await validateLineageOwnership(parsed.data.damId, parsed.data.sireId, ranchId);
  if (lineageError) {
    res.status(400).json({ error: true, message: lineageError });
    return;
  }

  const [animal] = await db
    .update(animalsTable)
    .set(parsed.data)
    .where(and(eq(animalsTable.id, animalId), eq(animalsTable.ranchId, ranchId)))
    .returning();

  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  res.json({ ...animal, latestHealthSeverity: null });
});

router.delete("/animals/:animalId", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const raw = Array.isArray(req.params.animalId) ? req.params.animalId[0] : req.params.animalId;
  const animalId = parseInt(raw, 10);

  const [deleted] = await db
    .delete(animalsTable)
    .where(and(eq(animalsTable.id, animalId), eq(animalsTable.ranchId, ranchId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
