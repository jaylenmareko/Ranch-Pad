import { Router, type IRouter } from "express";
import { db, ranchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const router: IRouter = Router();

router.get("/ranch", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const [ranch] = await db.select().from(ranchesTable).where(eq(ranchesTable.id, ranchId)).limit(1);

  if (!ranch) {
    res.status(404).json({ error: true, message: "Ranch not found" });
    return;
  }

  res.json({
    id: ranch.id,
    name: ranch.name,
    locationCity: ranch.locationCity,
    locationState: ranch.locationState,
    lat: ranch.lat,
    lon: ranch.lon,
    createdAt: ranch.createdAt,
  });
});

const updateRanchSchema = z.object({
  name: z.string().min(1).optional(),
  locationCity: z.string().nullable().optional(),
  locationState: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
});

router.put("/ranch", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const parsed = updateRanchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.locationCity !== undefined) updates.locationCity = parsed.data.locationCity;
  if (parsed.data.locationState !== undefined) updates.locationState = parsed.data.locationState;
  if (parsed.data.lat !== undefined) updates.lat = parsed.data.lat;
  if (parsed.data.lon !== undefined) updates.lon = parsed.data.lon;

  const [ranch] = await db
    .update(ranchesTable)
    .set(updates)
    .where(eq(ranchesTable.id, ranchId))
    .returning();

  if (!ranch) {
    res.status(404).json({ error: true, message: "Ranch not found" });
    return;
  }

  res.json({
    id: ranch.id,
    name: ranch.name,
    locationCity: ranch.locationCity,
    locationState: ranch.locationState,
    lat: ranch.lat,
    lon: ranch.lon,
    createdAt: ranch.createdAt,
  });
});

export default router;
