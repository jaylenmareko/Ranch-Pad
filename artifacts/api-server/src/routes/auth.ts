import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Resend } from "resend";
import { db, usersTable, ranchesTable, ranchUsersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const router: IRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  ranchName: z.string().optional(),
  ranchCity: z.string().optional(),
  ranchState: z.string().optional(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
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

  const { email, password, name, ranchName, ranchCity, ranchState, lat, lon, joinRanchName } = parsed.data;

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
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const [createdRanch] = await tx
        .insert(ranchesTable)
        .values({
          name: newRanchName,
          locationCity: ranchCity || null,
          locationState: ranchState || null,
          lat: lat ?? null,
          lon: lon ?? null,
          trialEndsAt,
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

const changeEmailSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
  currentPassword: z.string().min(1, "Current password is required"),
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
    res.status(403).json({ error: true, message: "Current password is incorrect" });
    return;
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash: newPasswordHash }).where(eq(usersTable.id, userId));

  res.json({ success: true });
});

router.put("/auth/me/email", requireAuth, async (req, res): Promise<void> => {
  const parsed = changeEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request";
    res.status(400).json({ error: true, message: msg });
    return;
  }

  const userId = req.user!.userId;
  const { newEmail, currentPassword } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: true, message: "User not found" });
    return;
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordMatch) {
    res.status(403).json({ error: true, message: "Current password is incorrect" });
    return;
  }

  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    res.status(400).json({ error: true, message: "New email is the same as your current email" });
    return;
  }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, newEmail.toLowerCase()))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: true, message: "That email address is already in use" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ email: newEmail.toLowerCase() })
    .where(eq(usersTable.id, userId))
    .returning();

  res.json({ id: updated.id, name: updated.name, email: updated.email });
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: true, message: "Please enter a valid email address" });
    return;
  }

  const { email } = parsed.data;

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await db
      .update(usersTable)
      .set({ resetToken: rawToken, resetTokenExpiry: expiry })
      .where(eq(usersTable.id, user.id));

    const resetUrl = `https://ranchpad.app/reset-password?token=${rawToken}`;

    await resend.emails.send({
      from: "RanchPad <noreply@ranchpad.app>",
      to: user.email,
      subject: "Reset your RanchPad password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #555; margin-bottom: 24px;">Hi ${user.name}, we received a request to reset your password. Click the button below — the link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #3e7354; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">Reset Password</a>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">If you didn't request this, you can ignore this email. Your password won't change.</p>
        </div>
      `,
    });
  }

  res.json({ success: true });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request";
    res.status(400).json({ error: true, message: msg });
    return;
  }

  const { token, password } = parsed.data;
  const now = new Date();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.resetToken, token), gt(usersTable.resetTokenExpiry!, now)))
    .limit(1);

  if (!user) {
    res.status(400).json({ error: true, message: "This reset link is invalid or has expired. Please request a new one." });
    return;
  }

  const newPasswordHash = await bcrypt.hash(password, 12);

  await db
    .update(usersTable)
    .set({ passwordHash: newPasswordHash, resetToken: null, resetTokenExpiry: null })
    .where(eq(usersTable.id, user.id));

  res.json({ success: true });
});

export default router;
