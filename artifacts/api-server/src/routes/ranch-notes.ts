import { Router, type IRouter } from "express";
import { db, ranchNotesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireNotViewer } from "../middlewares/auth.js";
import { z } from "zod";

const router: IRouter = Router();

const createRanchNoteSchema = z.object({
  noteDate: z.string().min(1),
  noteText: z.string().min(1),
});

router.get("/ranch-notes", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const notes = await db
    .select()
    .from(ranchNotesTable)
    .where(eq(ranchNotesTable.ranchId, ranchId))
    .orderBy(desc(ranchNotesTable.createdAt));
  res.json(notes);
});

router.post("/ranch-notes", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const userId = req.user!.userId;

  const parsed = createRanchNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: "noteDate and noteText are required" });
    return;
  }

  const [note] = await db
    .insert(ranchNotesTable)
    .values({ ...parsed.data, ranchId, userId })
    .returning();

  res.status(201).json(note);
});

export default router;
