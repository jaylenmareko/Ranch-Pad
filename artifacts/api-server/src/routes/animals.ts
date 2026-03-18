import { Router, type IRouter } from "express";
import multer from "multer";
import { parse as parseCsv } from "csv-parse/sync";
import { db, animalsTable, healthEventsTable, medicationRecordsTable } from "@workspace/db";
import { eq, and, or, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router: IRouter = Router();

const createAnimalSchema = z.object({
  name: z.string().min(1),
  tagNumber: z.string().nullable().optional(),
  species: z.string().min(1),
  breed: z.string().nullable().optional(),
  sex: z.string().min(1),
  dateOfBirth: z.string().nullable().optional(),
  damId: z.number().int().nullable().optional(),
  damName: z.string().nullable().optional(),
  sireId: z.number().int().nullable().optional(),
  sireName: z.string().nullable().optional(),
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

// ─── CSV Import ───────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  "name", "tag_number", "species", "breed", "sex", "date_of_birth",
  "health_event_description", "health_event_date", "health_event_severity",
  "medication_name", "dosage", "date_given", "next_due_date",
] as const;

const VALID_SEVERITIES = new Set(["low", "medium", "high"]);

interface ImportSkip {
  row: number;
  reason: string;
}

interface ImportSummary {
  animalsCreated: number;
  healthEventsCreated: number;
  medicationRecordsCreated: number;
  skipped: ImportSkip[];
}

router.post("/animals/import-csv", requireAuth, upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: true, message: "No file uploaded" });
    return;
  }

  const ranchId = req.user!.ranchId;

  let rows: Record<string, string>[];
  try {
    rows = parseCsv(req.file.buffer.toString("utf-8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  } catch {
    res.status(400).json({ error: true, message: "Could not parse CSV file. Make sure it is valid CSV with the correct headers." });
    return;
  }

  // Pre-load existing tag numbers for this ranch to detect duplicates efficiently
  const existingAnimals = await db
    .select({ tagNumber: animalsTable.tagNumber })
    .from(animalsTable)
    .where(eq(animalsTable.ranchId, ranchId));
  const existingTags = new Set(
    existingAnimals.map(a => a.tagNumber?.trim().toLowerCase()).filter(Boolean)
  );

  // Track tags we've seen in this import batch to catch intra-file duplicates
  const seenTagsThisImport = new Set<string>();

  const summary: ImportSummary = { animalsCreated: 0, healthEventsCreated: 0, medicationRecordsCreated: 0, skipped: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header row

    const name = (row["name"] ?? "").trim();
    const species = (row["species"] ?? "").trim();

    if (!name || !species) {
      summary.skipped.push({ row: rowNum, reason: "Missing required field: name and species are required" });
      continue;
    }

    const tagNumber = (row["tag_number"] ?? "").trim() || null;

    if (tagNumber) {
      const tagLower = tagNumber.toLowerCase();
      if (existingTags.has(tagLower)) {
        summary.skipped.push({ row: rowNum, reason: `Duplicate tag number "${tagNumber}" already exists in your herd` });
        continue;
      }
      if (seenTagsThisImport.has(tagLower)) {
        summary.skipped.push({ row: rowNum, reason: `Duplicate tag number "${tagNumber}" appears more than once in this file` });
        continue;
      }
      seenTagsThisImport.add(tagLower);
    }

    const sex = (row["sex"] ?? "").trim() || "Unknown";
    const breed = (row["breed"] ?? "").trim() || null;
    const dateOfBirth = (row["date_of_birth"] ?? "").trim() || null;

    // Health event fields — validate before starting transaction
    const heDesc = (row["health_event_description"] ?? "").trim();
    const heDate = (row["health_event_date"] ?? "").trim();
    const heSev = (row["health_event_severity"] ?? "").trim().toLowerCase();
    const hasHealthFields = !!(heDesc && heDate);
    if (hasHealthFields && !VALID_SEVERITIES.has(heSev)) {
      summary.skipped.push({ row: rowNum, reason: `Invalid health_event_severity "${heSev}": must be low, medium, or high` });
      continue;
    }
    const includeHealth = hasHealthFields && VALID_SEVERITIES.has(heSev);

    // Medication fields
    const medName = (row["medication_name"] ?? "").trim();
    const dateGiven = (row["date_given"] ?? "").trim();
    const includeMed = !!(medName && dateGiven);

    // All inserts for this row in one transaction — any failure rolls back everything
    try {
      await db.transaction(async (tx) => {
        const [newAnimal] = await tx
          .insert(animalsTable)
          .values({ ranchId, name, species, sex, tagNumber, breed, dateOfBirth })
          .returning();

        if (includeHealth) {
          await tx.insert(healthEventsTable).values({
            animalId: newAnimal.id,
            ranchId,
            description: heDesc,
            eventDate: heDate,
            severity: heSev,
          });
        }

        if (includeMed) {
          await tx.insert(medicationRecordsTable).values({
            animalId: newAnimal.id,
            ranchId,
            medicationName: medName,
            dosage: (row["dosage"] ?? "").trim() || null,
            dateGiven,
            nextDueDate: (row["next_due_date"] ?? "").trim() || null,
          });
        }
      });

      summary.animalsCreated++;
      if (includeHealth) summary.healthEventsCreated++;
      if (includeMed) summary.medicationRecordsCreated++;
      if (tagNumber) existingTags.add(tagNumber.toLowerCase());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown database error";
      summary.skipped.push({ row: rowNum, reason: `Database error: ${message}` });
    }
  }

  res.json(summary);
});

export default router;
