import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { ranchesTable } from "./ranches";
import { usersTable } from "./users";

export const teamInvitesTable = pgTable("team_invites", {
  id: serial("id").primaryKey(),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id),
  token: text("token").notNull().unique(),
  role: text("role").notNull(),
  createdBy: integer("created_by").notNull().references(() => usersTable.id),
  usedBy: integer("used_by").references(() => usersTable.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TeamInvite = typeof teamInvitesTable.$inferSelect;
