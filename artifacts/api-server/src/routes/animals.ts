import { Router, type IRouter } from "express";
import multer from "multer";
import { parse as parseCsv } from "csv-parse/sync";
import { db, animalsTable, healthEventsTable, medicationRecordsTable, animalAssignmentsTable, pastureLocationsTable, alertsTable } from "@workspace/db";
import { eq, and, or, inArray, isNull, isNotNull, getTableColumns } from "drizzle-orm";
import { requireAuth, requireOwner, requireNotViewer } from "../middlewares/auth.js";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

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
  locationId: z.number().int().nullable().optional(),
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
  const { species, sex, breed, search, archived } = req.query as Record<string, string>;
  const showArchived = archived === "true";

  let animals = await db
    .select({
      ...getTableColumns(animalsTable),
      locationName: pastureLocationsTable.name,
    })
    .from(animalsTable)
    .leftJoin(pastureLocationsTable, eq(animalsTable.locationId, pastureLocationsTable.id))
    .where(and(
      eq(animalsTable.ranchId, ranchId),
      showArchived ? isNotNull(animalsTable.archivedAt) : isNull(animalsTable.archivedAt),
    ))
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

  // Viewer: filter to assigned animals only
  const { userId, role } = req.user!;
  if (role === "viewer") {
    const assignments = await db
      .select({ animalId: animalAssignmentsTable.animalId })
      .from(animalAssignmentsTable)
      .where(and(eq(animalAssignmentsTable.ranchId, ranchId), eq(animalAssignmentsTable.viewerUserId, userId)));
    const assignedIds = new Set(assignments.map(a => a.animalId));
    animals = animals.filter(a => assignedIds.has(a.id));
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

router.post("/animals", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
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
  const { userId, role } = req.user!;
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

  // Viewer: only allow access to assigned animals
  if (role === "viewer") {
    const [assignment] = await db
      .select({ animalId: animalAssignmentsTable.animalId })
      .from(animalAssignmentsTable)
      .where(and(
        eq(animalAssignmentsTable.ranchId, ranchId),
        eq(animalAssignmentsTable.viewerUserId, userId),
        eq(animalAssignmentsTable.animalId, animalId)
      ))
      .limit(1);
    if (!assignment) {
      res.status(403).json({ error: true, message: "Access denied" });
      return;
    }
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

router.put("/animals/:animalId", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
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

router.patch("/animals/location", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;
  const { locationId, animalIds } = req.body;

  if (typeof locationId !== "number" || !Number.isInteger(locationId)) {
    res.status(400).json({ error: true, message: "locationId must be an integer" });
    return;
  }
  if (!Array.isArray(animalIds) || !animalIds.every(id => typeof id === "number")) {
    res.status(400).json({ error: true, message: "animalIds must be an array of integers" });
    return;
  }

  // Remove existing assignments for this location
  await db.update(animalsTable)
    .set({ locationId: null })
    .where(and(eq(animalsTable.ranchId, ranchId), eq(animalsTable.locationId, locationId)));

  // Apply new assignments
  if (animalIds.length > 0) {
    await db.update(animalsTable)
      .set({ locationId })
      .where(and(eq(animalsTable.ranchId, ranchId), inArray(animalsTable.id, animalIds)));
  }

  res.json({ updated: animalIds.length });
});

router.delete("/animals/:animalId", requireAuth, requireOwner, async (req, res): Promise<void> => {
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

// ─── Archive / Restore ────────────────────────────────────────────────────────

const archiveAnimalSchema = z.object({
  reason: z.enum(["sold", "deceased", "transferred"]),
  date: z.string().optional(),
  notes: z.string().nullable().optional(),
});

router.post("/animals/:animalId/archive", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const raw = Array.isArray(req.params.animalId) ? req.params.animalId[0] : req.params.animalId;
  const animalId = parseInt(raw, 10);

  const parsed = archiveAnimalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const [updated] = await db
    .update(animalsTable)
    .set({
      archivedAt: new Date(),
      archiveReason: parsed.data.reason,
      archiveDate: parsed.data.date ?? today,
      archiveNotes: parsed.data.notes ?? null,
    })
    .where(and(eq(animalsTable.id, animalId), eq(animalsTable.ranchId, ranchId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  // Dismiss any active alerts for this animal so they disappear immediately
  await db
    .update(alertsTable)
    .set({ isDismissed: true })
    .where(and(eq(alertsTable.animalId, animalId), eq(alertsTable.isDismissed, false)));

  res.json(updated);
});

router.post("/animals/:animalId/restore", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const raw = Array.isArray(req.params.animalId) ? req.params.animalId[0] : req.params.animalId;
  const animalId = parseInt(raw, 10);

  const [updated] = await db
    .update(animalsTable)
    .set({
      archivedAt: null,
      archiveReason: null,
      archiveDate: null,
      archiveNotes: null,
    })
    .where(and(eq(animalsTable.id, animalId), eq(animalsTable.ranchId, ranchId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  res.json(updated);
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

router.post("/animals/import-csv", requireAuth, requireNotViewer, upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: true, message: "No file uploaded" });
    return;
  }

  const ranchId = req.user!.ranchId;
  const shouldReplace = req.query.replace === "true";

  let rows: Record<string, string>[];
  try {
    rows = parseCsv(req.file.buffer.toString("utf-8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  } catch {
    res.status(400).json({ error: true, errorType: "WRONG_FORMAT", message: "This file doesn't match the RanchPad template. Please download our CSV template and use that format." });
    return;
  }

  if (rows.length === 0) {
    res.status(400).json({ error: true, errorType: "EMPTY_FILE", message: "This file appears to be empty. Please fill in the template and try again." });
    return;
  }

  // Verify the file uses RanchPad's column headers (at least name or species must be present)
  const fileHeaders = new Set(Object.keys(rows[0]).map(k => k.toLowerCase().trim()));
  const hasValidHeaders = CSV_HEADERS.some(h => fileHeaders.has(h));
  if (!hasValidHeaders) {
    res.status(400).json({ error: true, errorType: "WRONG_FORMAT", message: "This file doesn't match the RanchPad template. Please download our CSV template and use that format." });
    return;
  }

  // If replacing, wipe all existing animals for this ranch first
  if (shouldReplace) {
    await db.delete(animalsTable).where(eq(animalsTable.ranchId, ranchId));
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

    // Health event — only created when all three fields are present and severity is valid.
    // Partial or invalid fields do not block animal creation; the health event is simply omitted.
    const heDesc = (row["health_event_description"] ?? "").trim();
    const heDate = (row["health_event_date"] ?? "").trim();
    const heSev = (row["health_event_severity"] ?? "").trim().toLowerCase();
    const includeHealth = !!(heDesc && heDate && VALID_SEVERITIES.has(heSev));

    // Medication record — only created when medication_name and date_given are both present.
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

// ─── Photo scan: extract animal records from an image ─────────────────────────

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

router.post("/animals/scan-photo", requireAuth, requireNotViewer, photoUpload.single("photo"), async (req, res): Promise<void> => {
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  if (!apiKey) {
    res.status(500).json({ error: true, message: "AI features not configured" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: true, message: "No image file provided" });
    return;
  }

  const base64 = req.file.buffer.toString("base64");
  const mimeType = req.file.mimetype as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  try {
    const anthropic = new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: base64 },
            },
            {
              type: "text",
              text: `You are reading a livestock record book, farm register, ear tag list, or handwritten notes page.

Extract every individual animal record you can find in this image.

For each animal return a JSON object with these fields:
- "name": animal name, or use the tag number as name if no name is given (e.g. "A-101")
- "tagNumber": ear tag number, ID number, or registration number if visible (string or null)
- "species": must be exactly one of: Cattle, Sheep, Goat, Pig, Horse, Other
- "breed": breed name if mentioned, otherwise null
- "sex": use exact terms — Cattle: Heifer/Cow/Bull/Steer, Sheep: Ewe/Ram/Wether, Goat: Doe/Buck/Wether, Pig: Gilt/Sow/Boar/Barrow, Horse: Filly/Mare/Stallion/Gelding, Other: Female/Male
- "dateOfBirth": YYYY-MM-DD format if a birth date is visible, otherwise null
- "notes": any health notes, vaccination records, or other comments for this animal (string or null)

Rules:
- Default to "Cattle" if species cannot be determined from context.
- If sex is unclear, use "Heifer" for cattle, "Ewe" for sheep, "Doe" for goats.
- If only a tag number is visible with no separate name, use the tag number as the name.
- Return a JSON array only. No explanation, no markdown, no code blocks — just the raw JSON array.
- If no animals are found, return: []`,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      res.json({ animals: [] });
      return;
    }

    let extracted: unknown[];
    try {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) { res.json({ animals: [] }); return; }
      extracted = JSON.parse(jsonMatch[0]);
    } catch {
      res.json({ animals: [] });
      return;
    }

    const validSpecies = new Set(["Cattle", "Sheep", "Goat", "Pig", "Horse", "Other"]);
    const animals = (extracted as Record<string, unknown>[])
      .filter(a => a && typeof a === "object")
      .map(a => ({
        name: String(a.name ?? "").trim().slice(0, 100) || null,
        tagNumber: a.tagNumber ? String(a.tagNumber).trim().slice(0, 50) : null,
        species: validSpecies.has(String(a.species)) ? String(a.species) : "Cattle",
        breed: a.breed ? String(a.breed).trim().slice(0, 100) : null,
        sex: a.sex ? String(a.sex).trim().slice(0, 50) : null,
        dateOfBirth: a.dateOfBirth ? String(a.dateOfBirth) : null,
        notes: a.notes ? String(a.notes).trim().slice(0, 500) : null,
      }))
      .filter(a => a.name);

    res.json({ animals });
  } catch (err) {
    console.error("Photo scan failed:", err);
    res.status(500).json({ error: true, message: "Photo scan failed. Please try again." });
  }
});

export default router;
