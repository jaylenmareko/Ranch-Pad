import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ranchesTable } from "./ranches";
import { animalsTable } from "./animals";

export const medicationRecordsTable = pgTable("medication_records", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animalsTable.id),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id),
  medicationName: text("medication_name").notNull(),
  dosage: text("dosage"),
  dateGiven: text("date_given").notNull(),
  nextDueDate: text("next_due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMedicationRecordSchema = createInsertSchema(medicationRecordsTable).omit({ id: true, createdAt: true });
export type InsertMedicationRecord = z.infer<typeof insertMedicationRecordSchema>;
export type MedicationRecord = typeof medicationRecordsTable.$inferSelect;
