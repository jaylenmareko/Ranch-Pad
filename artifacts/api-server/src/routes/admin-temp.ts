import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  ranchesTable,
  ranchUsersTable,
  animalsTable,
  healthEventsTable,
  medicationRecordsTable,
  famachaScoresTable,
  animalPhotosTable,
  animalAssignmentsTable,
  alertsTable,
  fieldNotesTable,
  ranchNotesTable,
  pastureLocationsTable,
  teamInvitesTable,
  deleteRequestsTable,
} from "@workspace/db";
import { eq, or } from "drizzle-orm";

const router: IRouter = Router();

router.post("/admin-purge-users-2025", async (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.JWT_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { emails } = req.body as { emails: string[] };
  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "emails array required" });
  }

  const results: Record<string, string> = {};

  for (const email of emails) {
    try {
      const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
      if (users.length === 0) {
        results[email] = "not found";
        continue;
      }
      const userId = users[0].id;

      const memberships = await db.select().from(ranchUsersTable).where(eq(ranchUsersTable.userId, userId));
      const ownerOf = memberships.filter(m => m.role === "owner").map(m => m.ranchId);

      for (const ranchId of ownerOf) {
        const animals = await db.select().from(animalsTable).where(eq(animalsTable.ranchId, ranchId));

        for (const animal of animals) {
          await db.delete(famachaScoresTable).where(eq(famachaScoresTable.animalId, animal.id));
          await db.delete(medicationRecordsTable).where(eq(medicationRecordsTable.animalId, animal.id));
          await db.delete(healthEventsTable).where(eq(healthEventsTable.animalId, animal.id));
          await db.delete(animalPhotosTable).where(eq(animalPhotosTable.animalId, animal.id));
          await db.delete(animalAssignmentsTable).where(eq(animalAssignmentsTable.animalId, animal.id));
        }

        await db.delete(alertsTable).where(eq(alertsTable.ranchId, ranchId));
        await db.delete(fieldNotesTable).where(eq(fieldNotesTable.ranchId, ranchId));
        await db.delete(ranchNotesTable).where(eq(ranchNotesTable.ranchId, ranchId));
        await db.delete(pastureLocationsTable).where(eq(pastureLocationsTable.ranchId, ranchId));
        await db.delete(teamInvitesTable).where(eq(teamInvitesTable.ranchId, ranchId));
        await db.delete(deleteRequestsTable).where(eq(deleteRequestsTable.ranchId, ranchId));
        await db.delete(animalsTable).where(eq(animalsTable.ranchId, ranchId));
        await db.delete(ranchUsersTable).where(eq(ranchUsersTable.ranchId, ranchId));
        await db.delete(ranchesTable).where(eq(ranchesTable.id, ranchId));
      }

      if (ownerOf.length === 0) {
        await db.delete(ranchUsersTable).where(eq(ranchUsersTable.userId, userId));
      }

      // Clean up any remaining records referencing this user directly
      await db.delete(animalAssignmentsTable).where(eq(animalAssignmentsTable.viewerUserId, userId));
      await db.delete(deleteRequestsTable).where(
        or(
          eq(deleteRequestsTable.requestedBy, userId),
          eq(deleteRequestsTable.reviewedBy, userId)
        )
      );
      await db.delete(teamInvitesTable).where(
        or(
          eq(teamInvitesTable.createdBy, userId),
          eq(teamInvitesTable.usedBy, userId)
        )
      );
      await db.delete(ranchUsersTable).where(eq(ranchUsersTable.userId, userId));

      await db.delete(usersTable).where(eq(usersTable.id, userId));
      results[email] = "deleted";
    } catch (err) {
      results[email] = `error: ${(err as Error).message}`;
    }
  }

  return res.json({ results });
});

export default router;
