import { Router, type IRouter } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  db,
  ranchUsersTable,
  usersTable,
  ranchesTable,
  teamInvitesTable,
  deleteRequestsTable,
  animalAssignmentsTable,
  animalsTable,
  healthEventsTable,
  medicationRecordsTable,
  fieldNotesTable,
  famachaScoresTable,
} from "@workspace/db";
import { eq, and, isNull, gt, lt, desc, sql } from "drizzle-orm";
import { requireAuth, requireOwner, requireNotViewer } from "../middlewares/auth.js";
import { signToken } from "../lib/jwt.js";

const router: IRouter = Router();

// ─── My Role ──────────────────────────────────────────────────────────────────

router.get("/team/my-role", requireAuth, async (req, res): Promise<void> => {
  const { ranchId, role } = req.user!;

  let pendingDeleteRequests = 0;
  if (role === "owner") {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deleteRequestsTable)
      .where(and(eq(deleteRequestsTable.ranchId, ranchId), eq(deleteRequestsTable.status, "pending")));
    pendingDeleteRequests = Number(result?.count ?? 0);
  }

  res.json({ role, pendingDeleteRequests });
});

// ─── Team Members ─────────────────────────────────────────────────────────────

router.get("/team/members", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;

  const members = await db
    .select({
      userId: ranchUsersTable.userId,
      role: ranchUsersTable.role,
      joinedAt: ranchUsersTable.createdAt,
      name: usersTable.name,
      email: usersTable.email,
    })
    .from(ranchUsersTable)
    .innerJoin(usersTable, eq(ranchUsersTable.userId, usersTable.id))
    .where(eq(ranchUsersTable.ranchId, ranchId))
    .orderBy(ranchUsersTable.createdAt);

  const now = new Date();

  // Hard-delete expired unused invites so they don't accumulate
  await db
    .delete(teamInvitesTable)
    .where(
      and(
        eq(teamInvitesTable.ranchId, ranchId),
        isNull(teamInvitesTable.usedBy),
        lt(teamInvitesTable.expiresAt, now),
      )
    );

  const invites = await db
    .select()
    .from(teamInvitesTable)
    .where(
      and(
        eq(teamInvitesTable.ranchId, ranchId),
        isNull(teamInvitesTable.usedBy),
        gt(teamInvitesTable.expiresAt, now),
      )
    )
    .orderBy(desc(teamInvitesTable.createdAt));

  res.json({ members, invites });
});

router.put("/team/members/:userId", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;
  const targetUserId = parseInt(req.params.userId, 10);
  const { role } = req.body;

  if (!["ranch_hand", "viewer"].includes(role)) {
    res.status(400).json({ error: true, message: "Role must be ranch_hand or viewer" });
    return;
  }

  const [member] = await db
    .select()
    .from(ranchUsersTable)
    .where(and(eq(ranchUsersTable.ranchId, ranchId), eq(ranchUsersTable.userId, targetUserId)))
    .limit(1);

  if (!member) {
    res.status(404).json({ error: true, message: "Member not found" });
    return;
  }
  if (member.role === "owner") {
    res.status(403).json({ error: true, message: "Cannot change the owner's role" });
    return;
  }

  await db
    .update(ranchUsersTable)
    .set({ role })
    .where(and(eq(ranchUsersTable.ranchId, ranchId), eq(ranchUsersTable.userId, targetUserId)));

  res.json({ success: true });
});

router.delete("/team/members/:userId", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId, userId: ownerId } = req.user!;
  const targetUserId = parseInt(req.params.userId, 10);

  if (targetUserId === ownerId) {
    res.status(403).json({ error: true, message: "Cannot remove yourself" });
    return;
  }

  const [member] = await db
    .select()
    .from(ranchUsersTable)
    .where(and(eq(ranchUsersTable.ranchId, ranchId), eq(ranchUsersTable.userId, targetUserId)))
    .limit(1);

  if (!member || member.role === "owner") {
    res.status(403).json({ error: true, message: "Cannot remove this member" });
    return;
  }

  await db
    .delete(ranchUsersTable)
    .where(and(eq(ranchUsersTable.ranchId, ranchId), eq(ranchUsersTable.userId, targetUserId)));

  res.sendStatus(204);
});

// ─── Invites ──────────────────────────────────────────────────────────────────

router.post("/team/invite", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { userId: createdBy, ranchId } = req.user!;
  const { role } = req.body;

  if (!["ranch_hand", "viewer"].includes(role)) {
    res.status(400).json({ error: true, message: "Role must be ranch_hand or viewer" });
    return;
  }

  const token = crypto.randomBytes(6).toString("base64url");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await db.insert(teamInvitesTable).values({ ranchId, token, role, createdBy, expiresAt });

  const origin = (req.headers.origin as string) || `https://${req.headers.host}`;
  res.json({ token, url: `${origin}/invite/${token}` });
});

router.delete("/team/invite/:id", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;
  const id = parseInt(req.params.id, 10);

  const [invite] = await db
    .select({ id: teamInvitesTable.id })
    .from(teamInvitesTable)
    .where(and(eq(teamInvitesTable.id, id), eq(teamInvitesTable.ranchId, ranchId)));

  if (!invite) {
    res.status(404).json({ error: true, message: "Invite not found" });
    return;
  }

  await db.delete(teamInvitesTable).where(eq(teamInvitesTable.id, id));
  res.sendStatus(204);
});

router.get("/team/invite/:token", async (req, res): Promise<void> => {
  const { token } = req.params;

  const [invite] = await db
    .select({
      id: teamInvitesTable.id,
      role: teamInvitesTable.role,
      expiresAt: teamInvitesTable.expiresAt,
      usedBy: teamInvitesTable.usedBy,
      ranchName: ranchesTable.name,
    })
    .from(teamInvitesTable)
    .innerJoin(ranchesTable, eq(teamInvitesTable.ranchId, ranchesTable.id))
    .where(eq(teamInvitesTable.token, token))
    .limit(1);

  if (!invite) {
    res.status(404).json({ error: true, message: "Invite not found" });
    return;
  }
  if (invite.usedBy) {
    res.status(410).json({ error: true, message: "This invite link has already been used" });
    return;
  }
  if (new Date() > invite.expiresAt) {
    res.status(410).json({ error: true, message: "This invite link has expired" });
    return;
  }

  res.json({ valid: true, role: invite.role, ranchName: invite.ranchName });
});

// POST /team/invite/:token/login — existing user accepts invite by logging in
router.post("/team/invite/:token/login", async (req, res): Promise<void> => {
  const { token } = req.params;
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: true, message: "Email and password are required" });
    return;
  }

  // Validate invite
  const [invite] = await db
    .select({
      id: teamInvitesTable.id,
      role: teamInvitesTable.role,
      ranchId: teamInvitesTable.ranchId,
      expiresAt: teamInvitesTable.expiresAt,
      usedBy: teamInvitesTable.usedBy,
      ranchName: ranchesTable.name,
    })
    .from(teamInvitesTable)
    .innerJoin(ranchesTable, eq(teamInvitesTable.ranchId, ranchesTable.id))
    .where(eq(teamInvitesTable.token, token))
    .limit(1);

  if (!invite) {
    res.status(404).json({ error: true, message: "Invite not found" });
    return;
  }
  if (invite.usedBy) {
    res.status(410).json({ error: true, message: "This invite link has already been used" });
    return;
  }
  if (new Date() > invite.expiresAt) {
    res.status(410).json({ error: true, message: "This invite link has expired" });
    return;
  }

  // Authenticate user
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

  // Check not already a member
  const [existing] = await db
    .select()
    .from(ranchUsersTable)
    .where(and(eq(ranchUsersTable.userId, user.id), eq(ranchUsersTable.ranchId, invite.ranchId)))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: true, message: "You are already a member of this ranch" });
    return;
  }

  // Add to ranch + mark invite used
  await db.insert(ranchUsersTable).values({ userId: user.id, ranchId: invite.ranchId, role: invite.role });
  await db.update(teamInvitesTable).set({ usedBy: user.id }).where(eq(teamInvitesTable.id, invite.id));

  const authToken = signToken({ userId: user.id, ranchId: invite.ranchId, email: user.email });
  res.json({ token: authToken, ranchName: invite.ranchName });
});

// ─── Delete Requests ──────────────────────────────────────────────────────────

router.get("/team/delete-requests", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;

  const requests = await db
    .select({
      id: deleteRequestsTable.id,
      resourceType: deleteRequestsTable.resourceType,
      resourceId: deleteRequestsTable.resourceId,
      resourceName: deleteRequestsTable.resourceName,
      status: deleteRequestsTable.status,
      createdAt: deleteRequestsTable.createdAt,
      reviewedAt: deleteRequestsTable.reviewedAt,
      requesterName: usersTable.name,
      requesterEmail: usersTable.email,
    })
    .from(deleteRequestsTable)
    .innerJoin(usersTable, eq(deleteRequestsTable.requestedBy, usersTable.id))
    .where(eq(deleteRequestsTable.ranchId, ranchId))
    .orderBy(desc(deleteRequestsTable.createdAt));

  res.json(requests);
});

router.post("/team/delete-requests", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
  const { userId, ranchId, role } = req.user!;

  if (role === "owner") {
    res.status(400).json({ error: true, message: "Owners can delete directly" });
    return;
  }

  const { resourceType, resourceId, resourceName } = req.body;
  if (!resourceType || !resourceId || !resourceName) {
    res.status(400).json({ error: true, message: "resourceType, resourceId, and resourceName are required" });
    return;
  }

  const [existing] = await db
    .select({ id: deleteRequestsTable.id })
    .from(deleteRequestsTable)
    .where(
      and(
        eq(deleteRequestsTable.ranchId, ranchId),
        eq(deleteRequestsTable.resourceType, resourceType),
        eq(deleteRequestsTable.resourceId, resourceId),
        eq(deleteRequestsTable.status, "pending"),
      )
    )
    .limit(1);

  if (existing) {
    res.status(409).json({ error: true, message: "A pending deletion request already exists for this item" });
    return;
  }

  const [request] = await db
    .insert(deleteRequestsTable)
    .values({ ranchId, requestedBy: userId, resourceType, resourceId, resourceName, status: "pending" })
    .returning();

  res.status(201).json(request);
});

router.put("/team/delete-requests/:id", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { userId: reviewedBy, ranchId } = req.user!;
  const requestId = parseInt(req.params.id, 10);
  const { action } = req.body;

  if (!["approve", "deny"].includes(action)) {
    res.status(400).json({ error: true, message: "action must be approve or deny" });
    return;
  }

  const [request] = await db
    .select()
    .from(deleteRequestsTable)
    .where(and(eq(deleteRequestsTable.id, requestId), eq(deleteRequestsTable.ranchId, ranchId)))
    .limit(1);

  if (!request || request.status !== "pending") {
    res.status(404).json({ error: true, message: "Request not found or already resolved" });
    return;
  }

  if (action === "approve") {
    try {
      switch (request.resourceType) {
        case "animal":
          await db.delete(animalsTable).where(and(eq(animalsTable.id, request.resourceId), eq(animalsTable.ranchId, ranchId)));
          break;
        case "health_event":
          await db.delete(healthEventsTable).where(eq(healthEventsTable.id, request.resourceId));
          break;
        case "medication":
          await db.delete(medicationRecordsTable).where(eq(medicationRecordsTable.id, request.resourceId));
          break;
        case "field_note":
          await db.delete(fieldNotesTable).where(eq(fieldNotesTable.id, request.resourceId));
          break;
        case "famacha":
          await db.delete(famachaScoresTable).where(eq(famachaScoresTable.id, request.resourceId));
          break;
      }
    } catch {
      // Resource may already be gone — still mark as approved
    }
  }

  await db
    .update(deleteRequestsTable)
    .set({
      status: action === "approve" ? "approved" : "denied",
      reviewedAt: new Date(),
      reviewedBy,
    })
    .where(eq(deleteRequestsTable.id, requestId));

  res.json({ success: true });
});

// ─── Animal Assignments ───────────────────────────────────────────────────────

router.get("/team/animal-assignments", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;

  const viewers = await db
    .select({
      userId: ranchUsersTable.userId,
      name: usersTable.name,
      email: usersTable.email,
    })
    .from(ranchUsersTable)
    .innerJoin(usersTable, eq(ranchUsersTable.userId, usersTable.id))
    .where(and(eq(ranchUsersTable.ranchId, ranchId), eq(ranchUsersTable.role, "viewer")));

  const assignments = await db
    .select()
    .from(animalAssignmentsTable)
    .where(eq(animalAssignmentsTable.ranchId, ranchId));

  res.json({ viewers, assignments });
});

router.post("/team/animal-assignments", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;
  const { viewerUserId, animalId } = req.body;

  const [viewer] = await db
    .select()
    .from(ranchUsersTable)
    .where(
      and(
        eq(ranchUsersTable.ranchId, ranchId),
        eq(ranchUsersTable.userId, viewerUserId),
        eq(ranchUsersTable.role, "viewer"),
      )
    )
    .limit(1);

  if (!viewer) {
    res.status(400).json({ error: true, message: "Viewer not found in this ranch" });
    return;
  }

  const [existing] = await db
    .select()
    .from(animalAssignmentsTable)
    .where(
      and(
        eq(animalAssignmentsTable.ranchId, ranchId),
        eq(animalAssignmentsTable.animalId, animalId),
        eq(animalAssignmentsTable.viewerUserId, viewerUserId),
      )
    )
    .limit(1);

  if (existing) {
    res.json(existing);
    return;
  }

  const [assignment] = await db
    .insert(animalAssignmentsTable)
    .values({ ranchId, animalId, viewerUserId })
    .returning();

  res.status(201).json(assignment);
});

router.post("/team/animal-assignments/bulk", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;
  const { viewerUserId, animalIds } = req.body;

  if (!Array.isArray(animalIds) || animalIds.length === 0) {
    res.status(400).json({ error: true, message: "animalIds must be a non-empty array" });
    return;
  }

  const [viewer] = await db
    .select()
    .from(ranchUsersTable)
    .where(
      and(
        eq(ranchUsersTable.ranchId, ranchId),
        eq(ranchUsersTable.userId, viewerUserId),
        eq(ranchUsersTable.role, "viewer"),
      )
    )
    .limit(1);

  if (!viewer) {
    res.status(400).json({ error: true, message: "Viewer not found in this ranch" });
    return;
  }

  const existing = await db
    .select({ animalId: animalAssignmentsTable.animalId })
    .from(animalAssignmentsTable)
    .where(
      and(
        eq(animalAssignmentsTable.ranchId, ranchId),
        eq(animalAssignmentsTable.viewerUserId, viewerUserId),
      )
    );

  const existingIds = new Set(existing.map(e => e.animalId));
  const toInsert = (animalIds as number[]).filter(id => !existingIds.has(id));

  if (toInsert.length > 0) {
    await db.insert(animalAssignmentsTable).values(
      toInsert.map(animalId => ({ ranchId, animalId, viewerUserId }))
    );
  }

  res.json({ assigned: toInsert.length, skipped: animalIds.length - toInsert.length });
});

router.delete("/team/animal-assignments/:id", requireAuth, requireOwner, async (req, res): Promise<void> => {
  const { ranchId } = req.user!;
  const assignmentId = parseInt(req.params.id, 10);

  await db
    .delete(animalAssignmentsTable)
    .where(and(eq(animalAssignmentsTable.id, assignmentId), eq(animalAssignmentsTable.ranchId, ranchId)));

  res.sendStatus(204);
});

export default router;
