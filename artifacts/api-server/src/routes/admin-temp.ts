import { Router, type IRouter } from "express";
import { db, usersTable, ranchesTable, ranchUsersTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

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

      if (ownerOf.length > 0) {
        for (const ranchId of ownerOf) {
          await db.delete(ranchUsersTable).where(eq(ranchUsersTable.ranchId, ranchId));
          await db.delete(ranchesTable).where(eq(ranchesTable.id, ranchId));
        }
      } else {
        await db.delete(ranchUsersTable).where(eq(ranchUsersTable.userId, userId));
      }

      await db.delete(usersTable).where(eq(usersTable.id, userId));
      results[email] = "deleted";
    } catch (err) {
      results[email] = `error: ${(err as Error).message}`;
    }
  }

  return res.json({ results });
});

export default router;
