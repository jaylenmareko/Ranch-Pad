import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ranchesTable } from "./ranches";

export const animalsTable = pgTable("animals", {
  id: serial("id").primaryKey(),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id),
  name: text("name"),
  tagNumber: text("tag_number"),
  species: text("species").notNull(),
  breed: text("breed"),
  sex: text("sex").notNull(),
  dateOfBirth: text("date_of_birth"),
  damId: integer("dam_id"),
  damName: text("dam_name"),
  sireId: integer("sire_id"),
  sireName: text("sire_name"),
  expectedDueDate: text("expected_due_date"),
  locationId: integer("location_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  archiveReason: text("archive_reason"),
  archiveDate: text("archive_date"),
  archiveNotes: text("archive_notes"),
  isCull: boolean("is_cull").notNull().default(false),
});

export const insertAnimalSchema = createInsertSchema(animalsTable).omit({ id: true, createdAt: true });
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animalsTable.$inferSelect;
