import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db, usersTable, ranchesTable, ranchUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const router: IRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  ranchName: z.string().optional(),
  ranchCity: z.string().optional(),
  ranchState: z.string().optional(),
  joinRanchName: z.string().optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const { email, password, name, ranchName, ranchCity, ranchState, joinRanchName } = parsed.data;

  // Check duplicate email before any writes
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: true, message: "Email already in use" });
    return;
  }

  // Validate join-ranch target before any writes — prevents orphaned user rows
  let joinTarget: typeof ranchesTable.$inferSelect | null = null;
  if (joinRanchName) {
    const [found] = await db
      .select()
      .from(ranchesTable)
      .where(eq(ranchesTable.name, joinRanchName))
      .limit(1);
    if (!found) {
      res.status(400).json({ error: true, message: `Ranch "${joinRanchName}" not found` });
      return;
    }
    joinTarget = found;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // All validation passed — perform writes atomically in a transaction
  const { user, ranch } = await db.transaction(async (tx) => {
    const [newUser] = await tx.insert(usersTable).values({ email, passwordHash, name }).returning();

    let txRanch: typeof ranchesTable.$inferSelect;
    if (joinTarget) {
      txRanch = joinTarget;
    } else {
      const newRanchName = ranchName || `${name}'s Ranch`;
      const [createdRanch] = await tx
        .insert(ranchesTable)
        .values({
          name: newRanchName,
          locationCity: ranchCity || null,
          locationState: ranchState || null,
        })
        .returning();
      txRanch = createdRanch;
    }

    await tx.insert(ranchUsersTable).values({
      ranchId: txRanch.id,
      userId: newUser.id,
      role: joinTarget ? "member" : "owner",
    });

    return { user: newUser, ranch: txRanch };
  });

  const token = signToken({ userId: user.id, ranchId: ranch.id, email: user.email });

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    ranch: {
      id: ranch.id,
      name: ranch.name,
      locationCity: ranch.locationCity,
      locationState: ranch.locationState,
      lat: ranch.lat,
      lon: ranch.lon,
      createdAt: ranch.createdAt,
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: true, message: "Invalid email or password" });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: true, message: "Invalid email or password" });
    return;
  }

  // Get the user's ranch
  const [ranchUser] = await db
    .select()
    .from(ranchUsersTable)
    .where(eq(ranchUsersTable.userId, user.id))
    .limit(1);

  if (!ranchUser) {
    res.status(401).json({ error: true, message: "No ranch associated with this account" });
    return;
  }

  const [ranch] = await db
    .select()
    .from(ranchesTable)
    .where(eq(ranchesTable.id, ranchUser.ranchId))
    .limit(1);

  const token = signToken({ userId: user.id, ranchId: ranch.id, email: user.email });

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    ranch: {
      id: ranch.id,
      name: ranch.name,
      locationCity: ranch.locationCity,
      locationState: ranch.locationState,
      lat: ranch.lat,
      lon: ranch.lon,
      createdAt: ranch.createdAt,
    },
  });
});

const updateMeSchema = z.object({
  name: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: true, message: "User not found" });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email });
});

router.put("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: parsed.error.message });
    return;
  }

  const userId = req.user!.userId;
  const [updated] = await db
    .update(usersTable)
    .set({ name: parsed.data.name })
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: true, message: "User not found" });
    return;
  }

  res.json({ id: updated.id, name: updated.name, email: updated.email });
});

router.put("/auth/me/password", requireAuth, async (req, res): Promise<void> => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request";
    res.status(400).json({ error: true, message: msg });
    return;
  }

  const userId = req.user!.userId;
  const { currentPassword, newPassword } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: true, message: "User not found" });
    return;
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: true, message: "Current password is incorrect" });
    return;
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash: newPasswordHash }).where(eq(usersTable.id, userId));

  res.json({ success: true });
});

export default router;
