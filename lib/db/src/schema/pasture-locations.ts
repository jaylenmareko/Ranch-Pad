import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { ranchesTable } from "./ranches";

export const pastureLocationsTable = pgTable("pasture_locations", {
  id: serial("id").primaryKey(),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PastureLocation = typeof pastureLocationsTable.$inferSelect;
export type InsertPastureLocation = typeof pastureLocationsTable.$inferInsert;
