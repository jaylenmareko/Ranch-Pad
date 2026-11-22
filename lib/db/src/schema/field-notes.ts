import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ranchesTable } from "./ranches";
import { animalsTable } from "./animals";

export const fieldNotesTable = pgTable("field_notes", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animalsTable.id),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id),
  noteText: text("note_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFieldNoteSchema = createInsertSchema(fieldNotesTable).omit({ id: true, createdAt: true });
export type InsertFieldNote = z.infer<typeof insertFieldNoteSchema>;
export type FieldNote = typeof fieldNotesTable.$inferSelect;
