import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { ranchesTable } from "./ranches";

export const ranchNotesTable = pgTable("ranch_notes", {
  id: serial("id").primaryKey(),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id"),
  noteDate: text("note_date").notNull(),
  noteText: text("note_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RanchNote = typeof ranchNotesTable.$inferSelect;
