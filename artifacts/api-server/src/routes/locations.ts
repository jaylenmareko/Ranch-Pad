import { Router, type IRouter } from "express";
import { db, pastureLocationsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth, requireOwner } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/locations", requireAuth, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;
  const locations = await db
    .select()
    .from(pastureLocationsTable)
    .where(eq(pastureLocationsTable.ranchId, ranchId))
    .orderBy(asc(pastureLocationsTable.sortOrder), asc(pastureLocationsTable.createdAt));
  res.json(locations);
});

router.post("/locations", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;
  const { name } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: true, message: "Location name is required" });
    return;
  }

  const [location] = await db
    .insert(pastureLocationsTable)
    .values({ ranchId, name: name.trim(), sortOrder: 0 })
    .returning();

  res.status(201).json(location);
});

router.put("/locations/:id", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;
  const locationId = parseInt(req.params.id, 10);
  const { name } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: true, message: "Location name is required" });
    return;
  }

  const [location] = await db
    .update(pastureLocationsTable)
    .set({ name: name.trim() })
    .where(and(eq(pastureLocationsTable.id, locationId), eq(pastureLocationsTable.ranchId, ranchId)))
    .returning();

  if (!location) {
    res.status(404).json({ error: true, message: "Location not found" });
    return;
  }

  res.json(location);
});

router.delete("/locations/:id", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;
  const locationId = parseInt(req.params.id, 10);

  const [deleted] = await db
    .delete(pastureLocationsTable)
    .where(and(eq(pastureLocationsTable.id, locationId), eq(pastureLocationsTable.ranchId, ranchId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: true, message: "Location not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
