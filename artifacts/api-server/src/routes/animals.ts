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
  name: z.string().nullable().optional(),
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
  const { species, sex, breed, search, archived, cull } = req.query as Record<string, string>;
  const showArchived = archived === "true";
  const showCull = cull === "true";

  let whereCondition;
  if (showArchived) {
    whereCondition = and(eq(animalsTable.ranchId, ranchId), isNotNull(animalsTable.archivedAt));
  } else if (showCull) {
    whereCondition = and(eq(animalsTable.ranchId, ranchId), isNull(animalsTable.archivedAt), eq(animalsTable.isCull, true));
  } else {
    whereCondition = and(eq(animalsTable.ranchId, ranchId), isNull(animalsTable.archivedAt), eq(animalsTable.isCull, false));
  }

  let animals = await db
    .select({
      ...getTableColumns(animalsTable),
      locationName: pastureLocationsTable.name,
    })
    .from(animalsTable)
    .leftJoin(pastureLocationsTable, eq(animalsTable.locationId, pastureLocationsTable.id))
    .where(whereCondition)
    .orderBy(animalsTable.createdAt);

  // Filter in-memory for flexibility
  if (species) animals = animals.filter(a => a.species.toLowerCase() === species.toLowerCase());
  if (sex) animals = animals.filter(a => a.sex.toLowerCase() === sex.toLowerCase());
  if (breed) animals = animals.filter(a => a.breed?.toLowerCase().includes(breed.toLowerCase()));
  if (search) {
    const s = search.toLowerCase();
    animals = animals.filter(a =>
      a.name?.toLowerCase().includes(s) ||
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

router.post("/animals/:animalId/cull", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const raw = Array.isArray(req.params.animalId) ? req.params.animalId[0] : req.params.animalId;
  const animalId = parseInt(raw, 10);

  const [updated] = await db
    .update(animalsTable)
    .set({ isCull: true })
    .where(and(eq(animalsTable.id, animalId), eq(animalsTable.ranchId, ranchId), isNull(animalsTable.archivedAt)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  await db
    .update(alertsTable)
    .set({ isDismissed: true })
    .where(and(eq(alertsTable.animalId, animalId), eq(alertsTable.isDismissed, false)));

  res.json(updated);
});

router.patch("/animals/:animalId/cull-note", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const raw = Array.isArray(req.params.animalId) ? req.params.animalId[0] : req.params.animalId;
  const animalId = parseInt(raw, 10);
  const { cullNote } = req.body as { cullNote?: string | null };

  const [updated] = await db
    .update(animalsTable)
    .set({ cullNote: cullNote ?? null })
    .where(and(eq(animalsTable.id, animalId), eq(animalsTable.ranchId, ranchId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  res.json(updated);
});

router.post("/animals/:animalId/uncull", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const raw = Array.isArray(req.params.animalId) ? req.params.animalId[0] : req.params.animalId;
  const animalId = parseInt(raw, 10);

  const [updated] = await db
    .update(animalsTable)
    .set({ isCull: false })
    .where(and(eq(animalsTable.id, animalId), eq(animalsTable.ranchId, ranchId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  res.json(updated);
});

// ─── CSV Import ───────────────────────────────────────────────────────────────

const VALID_SEVERITIES = new Set(["low", "medium", "high"]);

// Strip everything except lowercase letters and digits for fuzzy matching
function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Common column name aliases → canonical field names
const COLUMN_ALIASES: Record<string, string> = {
  // name
  name: "name", animalname: "name", livestockname: "name",
  animal: "name", cattlename: "name",

  // species
  species: "species", type: "species", animaltype: "species",
  kind: "species", livestock: "species", cattletype: "species",

  // tag_number
  tagnumber: "tag_number", tag: "tag_number", tagno: "tag_number",
  tagnum: "tag_number", eartag: "tag_number", eartagno: "tag_number",
  tagid: "tag_number", animaltag: "tag_number", cattletag: "tag_number",
  lotno: "tag_number", lotnumber: "tag_number",

  // sex
  sex: "sex", gender: "sex", mf: "sex", malefemale: "sex",

  // breed
  breed: "breed", breedtype: "breed", animalbreed: "breed",
  cattlebreed: "breed", breedvariety: "breed",

  // date_of_birth
  dateofbirth: "date_of_birth", dob: "date_of_birth",
  birthdate: "date_of_birth", borndate: "date_of_birth",
  born: "date_of_birth", birthyear: "date_of_birth",
  calveddate: "date_of_birth", calved: "date_of_birth",

  // health_event_description
  healtheventdescription: "health_event_description",
  healthevent: "health_event_description",
  healthnote: "health_event_description",
  healthnotes: "health_event_description",
  healthdescription: "health_event_description",
  health: "health_event_description",
  condition: "health_event_description",
  diagnosis: "health_event_description",
  illness: "health_event_description",
  note: "health_event_description",
  notes: "health_event_description",

  // health_event_date
  healtheventdate: "health_event_date",
  healthdate: "health_event_date",
  eventdate: "health_event_date",

  // health_event_severity
  healtheventserverity: "health_event_severity",
  healtheventsecerity: "health_event_severity",
  severity: "health_event_severity",
  healthseverity: "health_event_severity",
  urgency: "health_event_severity",

  // medication_name
  medicationname: "medication_name", medication: "medication_name",
  medicine: "medication_name", drug: "medication_name",
  med: "medication_name", medname: "medication_name",
  medicinename: "medication_name", treatment: "medication_name",
  vaccine: "medication_name", vaccination: "medication_name",

  // date_given
  dategiven: "date_given", givendate: "date_given",
  administered: "date_given", dateadministered: "date_given",
  treatmentdate: "date_given", vaccinedate: "date_given",

  // dosage
  dosage: "dosage", dose: "dosage", amount: "dosage",
  quantity: "dosage", doseamount: "dosage",

  // next_due_date
  nextduedate: "next_due_date", nextdue: "next_due_date",
  nextdose: "next_due_date", duedate: "next_due_date",
  nextdosedate: "next_due_date", boosterdate: "next_due_date",
  followup: "next_due_date", followupdate: "next_due_date",
};

// Build a remapping of actual CSV headers to canonical field names
function buildHeaderMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const h of headers) {
    const norm = normalizeKey(h);
    const canonical = COLUMN_ALIASES[norm];
    if (canonical) map[h] = canonical;
    else map[h] = h; // keep original if no alias found
  }
  return map;
}

// Remap a single row using the header map
function remapRow(row: Record<string, string>, headerMap: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const canonical = headerMap[key] ?? key;
    out[canonical] = value;
  }
  return out;
}

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

  let rawRows: Record<string, string>[];
  try {
    rawRows = parseCsv(req.file.buffer.toString("utf-8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  } catch {
    res.status(400).json({ error: true, errorType: "WRONG_FORMAT", message: "Could not read this file as a CSV. Make sure it is a valid spreadsheet file." });
    return;
  }

  if (rawRows.length === 0) {
    res.status(400).json({ error: true, errorType: "EMPTY_FILE", message: "This file appears to be empty — no animals found to import." });
    return;
  }

  // Build a fuzzy header map from whatever column names the file uses
  const headerMap = buildHeaderMap(Object.keys(rawRows[0]));

  // Remap all rows to canonical field names
  const rows = rawRows.map(r => remapRow(r, headerMap));

  // At minimum we need to be able to find an animal name or species column
  const canonicalFields = new Set(Object.values(headerMap));
  if (!canonicalFields.has("name") && !canonicalFields.has("species")) {
    res.status(400).json({ error: true, errorType: "WRONG_FORMAT", message: "Could not find an animal name or species column in this file. Make sure your spreadsheet has columns for the animal's name and species." });
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
  const speciesHint = typeof req.body?.species === "string" && req.body.species ? req.body.species : null;
  const validSpeciesSet = new Set(["Cattle", "Sheep", "Goat", "Pig", "Horse", "Other"]);
  const defaultSpecies = speciesHint && validSpeciesSet.has(speciesHint) ? speciesHint : "Cattle";

  const speciesHintLine = speciesHint
    ? `IMPORTANT: The user has told you these records are for ${speciesHint}. Use "${speciesHint}" as the species for any animal where the species is not explicitly written on the page.`
    : `Default to "Cattle" if species cannot be determined from context.`;

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
- "name": animal name if present, otherwise null
- "tagNumber": ear tag number, ID number, or registration number if visible (string or null)
- "species": must be exactly one of: Cattle, Sheep, Goat, Pig, Horse, Other
- "breed": breed name if mentioned, otherwise null
- "sex": use exact terms — Cattle: Heifer/Cow/Bull/Steer, Sheep: Ewe/Ram/Wether, Goat: Doe/Buck/Wether, Pig: Gilt/Sow/Boar/Barrow, Horse: Filly/Mare/Stallion/Gelding, Other: Female/Male
- "dateOfBirth": YYYY-MM-DD format if a birth date is visible, otherwise null
- "notes": any health notes, vaccination records, or other comments for this animal (string or null)

Rules:
- ${speciesHintLine}
- If sex is unclear, use the most common female term for the species (Heifer for cattle, Ewe for sheep, Doe for goats).
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

    const animals = (extracted as Record<string, unknown>[])
      .filter(a => a && typeof a === "object")
      .map(a => ({
        name: a.name ? String(a.name).trim().slice(0, 100) : null,
        tagNumber: a.tagNumber ? String(a.tagNumber).trim().slice(0, 50) : null,
        species: validSpeciesSet.has(String(a.species)) ? String(a.species) : defaultSpecies,
        breed: a.breed ? String(a.breed).trim().slice(0, 100) : null,
        sex: a.sex ? String(a.sex).trim().slice(0, 50) : null,
        dateOfBirth: a.dateOfBirth ? String(a.dateOfBirth) : null,
        notes: a.notes ? String(a.notes).trim().slice(0, 500) : null,
      }))
      .filter(a => a.name || a.tagNumber);

    res.json({ animals });
  } catch (err) {
    console.error("Photo scan failed:", err);
    res.status(500).json({ error: true, message: "Photo scan failed. Please try again." });
  }
});

// ─── Record scan: extract health events + medications from a photo ─────────────

router.post("/animals/:animalId/scan-records", requireAuth, requireNotViewer, photoUpload.single("photo"), async (req, res): Promise<void> => {
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
  const today = new Date().toISOString().split("T")[0];

  try {
    const anthropic = new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
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
              text: `You are reading a livestock health record, vet invoice, treatment log, medication log, or handwritten farm notes.

Extract all health events and medication records from this image.

Return a single JSON object with two arrays:

"healthEvents": array of objects with:
- "eventDate": date in YYYY-MM-DD format (required — if only month/day is given, assume year ${today.slice(0,4)})
- "description": a concise description of the health event, condition, or observation (required)
- "severity": exactly "low", "medium", or "high" (required — "high" for serious illness/injury/surgery, "medium" for moderate issues/treatments, "low" for routine checks/mild issues)
- "veterinarian": vet name if mentioned, otherwise null

"medications": array of objects with:
- "medicationName": name of medication, vaccine, or treatment product (required)
- "dosage": dose amount and unit if visible, otherwise null
- "dateGiven": date in YYYY-MM-DD format (required — if only month/day is given, assume year ${today.slice(0,4)})
- "nextDueDate": next due or booster date in YYYY-MM-DD format if mentioned, otherwise null
- "notes": any additional administration notes, otherwise null

Rules:
- Today is ${today}. Use this to resolve ambiguous or partial dates.
- Return raw JSON only. No explanation, no markdown, no code blocks.
- If you cannot find any records, return: {"healthEvents":[],"medications":[]}`,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      res.json({ healthEvents: [], medications: [] });
      return;
    }

    let extracted: { healthEvents: unknown[]; medications: unknown[] };
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { res.json({ healthEvents: [], medications: [] }); return; }
      extracted = JSON.parse(jsonMatch[0]);
    } catch {
      res.json({ healthEvents: [], medications: [] });
      return;
    }

    const healthEvents = (Array.isArray(extracted?.healthEvents) ? extracted.healthEvents : [])
      .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
      .map(e => ({
        eventDate: String(e.eventDate ?? "").trim(),
        description: String(e.description ?? "").trim().slice(0, 500),
        severity: (["low", "medium", "high"].includes(String(e.severity)) ? String(e.severity) : "medium") as "low" | "medium" | "high",
        veterinarian: e.veterinarian ? String(e.veterinarian).trim().slice(0, 100) : null,
      }))
      .filter(e => e.eventDate && e.description);

    const medications = (Array.isArray(extracted?.medications) ? extracted.medications : [])
      .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
      .map(m => ({
        medicationName: String(m.medicationName ?? "").trim().slice(0, 100),
        dosage: m.dosage ? String(m.dosage).trim().slice(0, 100) : null,
        dateGiven: String(m.dateGiven ?? "").trim(),
        nextDueDate: m.nextDueDate ? String(m.nextDueDate).trim() : null,
        notes: m.notes ? String(m.notes).trim().slice(0, 300) : null,
      }))
      .filter(m => m.medicationName && m.dateGiven);

    res.json({ healthEvents, medications });
  } catch (err) {
    console.error("Record scan failed:", err);
    res.status(500).json({ error: true, message: "Record scan failed. Please try again." });
  }
});

export default router;
