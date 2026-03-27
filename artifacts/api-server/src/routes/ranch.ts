import { Router, type IRouter } from "express";
import { db, ranchesTable, ranchUsersTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireOwner } from "../middlewares/auth.js";
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

// Returns all ranches the authenticated user belongs to
router.get("/ranch/my-ranches", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req.user!;

  const userRanches = await db
    .select({
      ranchId: ranchUsersTable.ranchId,
      role: ranchUsersTable.role,
      ranchName: ranchesTable.name,
    })
    .from(ranchUsersTable)
    .innerJoin(ranchesTable, eq(ranchUsersTable.ranchId, ranchesTable.id))
    .where(eq(ranchUsersTable.userId, userId));

  // For non-owner entries, look up the owner's name
  const result = await Promise.all(
    userRanches.map(async (ur) => {
      let ownerName: string | null = null;
      const isPersonal = ur.role === "owner";
      if (!isPersonal) {
        const [owner] = await db
          .select({ name: usersTable.name })
          .from(ranchUsersTable)
          .innerJoin(usersTable, eq(ranchUsersTable.userId, usersTable.id))
          .where(and(eq(ranchUsersTable.ranchId, ur.ranchId), eq(ranchUsersTable.role, "owner")))
          .limit(1);
        ownerName = owner?.name ?? null;
      }

      return {
        id: ur.ranchId,
        name: ur.ranchName,
        role: ur.role === "member" ? "ranch_hand" : ur.role,
        ownerName,
        isPersonal,
      };
    })
  );

  res.json(result);
});

const createPersonalRanchSchema = z.object({
  name: z.string().min(1),
  locationCity: z.string().nullable().optional(),
  locationState: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
});

// Create a personal ranch for a user who joined via invite (has no personal ranch yet)
router.post("/ranch/create-personal", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req.user!;

  // Verify user doesn't already have a personal ranch
  const [existing] = await db
    .select({ ranchId: ranchUsersTable.ranchId })
    .from(ranchUsersTable)
    .where(and(eq(ranchUsersTable.userId, userId), eq(ranchUsersTable.role, "owner")))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: true, message: "You already have a personal ranch" });
    return;
  }

  const parsed = createPersonalRanchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const ranch = await db.transaction(async (tx) => {
    const [newRanch] = await tx
      .insert(ranchesTable)
      .values({
        name: parsed.data.name,
        locationCity: parsed.data.locationCity ?? null,
        locationState: parsed.data.locationState ?? null,
        lat: parsed.data.lat ?? null,
        lon: parsed.data.lon ?? null,
        trialEndsAt,
      })
      .returning();

    await tx.insert(ranchUsersTable).values({
      ranchId: newRanch.id,
      userId,
      role: "owner",
    });

    return newRanch;
  });

  res.status(201).json({
    id: ranch.id,
    name: ranch.name,
    locationCity: ranch.locationCity,
    locationState: ranch.locationState,
    lat: ranch.lat,
    lon: ranch.lon,
    isPersonal: true,
    role: "owner",
  });
});

const updateRanchSchema = z.object({
  name: z.string().min(1).optional(),
  locationCity: z.string().nullable().optional(),
  locationState: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
});

router.put("/ranch", requireAuth, requireOwner, async (req, res): Promise<void> => {
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
