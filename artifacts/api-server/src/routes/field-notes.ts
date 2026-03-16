import { Router, type IRouter } from "express";
import { db, fieldNotesTable, animalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const router: IRouter = Router();

const createFieldNoteSchema = z.object({
  noteText: z.string().min(1),
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

router.get("/animals/:animalId/notes", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const notes = await db
    .select()
    .from(fieldNotesTable)
    .where(eq(fieldNotesTable.animalId, animalId))
    .orderBy(fieldNotesTable.createdAt);

  res.json(notes);
});

router.post("/animals/:animalId/notes", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const parsed = createFieldNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const [note] = await db
    .insert(fieldNotesTable)
    .values({ ...parsed.data, animalId, ranchId })
    .returning();

  res.status(201).json(note);
});

const updateFieldNoteSchema = z.object({
  noteText: z.string().min(1).optional(),
});

router.patch("/animals/:animalId/notes/:noteId", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);
  const noteId = parseId(req.params.noteId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const parsed = updateFieldNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(fieldNotesTable)
    .set(parsed.data)
    .where(and(eq(fieldNotesTable.id, noteId), eq(fieldNotesTable.animalId, animalId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: true, message: "Field note not found" });
    return;
  }

  res.json(updated);
});

router.delete("/animals/:animalId/notes/:noteId", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const animalId = parseId(req.params.animalId);
  const noteId = parseId(req.params.noteId);

  const animal = await verifyAnimalOwnership(animalId, ranchId);
  if (!animal) {
    res.status(404).json({ error: true, message: "Animal not found" });
    return;
  }

  const [deleted] = await db
    .delete(fieldNotesTable)
    .where(and(eq(fieldNotesTable.id, noteId), eq(fieldNotesTable.animalId, animalId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: true, message: "Field note not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
