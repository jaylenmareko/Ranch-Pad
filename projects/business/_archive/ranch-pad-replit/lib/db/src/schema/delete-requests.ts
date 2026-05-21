import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { ranchesTable } from "./ranches";
import { usersTable } from "./users";

export const deleteRequestsTable = pgTable("delete_requests", {
  id: serial("id").primaryKey(),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id),
  requestedBy: integer("requested_by").notNull().references(() => usersTable.id),
  resourceType: text("resource_type").notNull(),
  resourceId: integer("resource_id").notNull(),
  resourceName: text("resource_name").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id),
});

export type DeleteRequest = typeof deleteRequestsTable.$inferSelect;
