import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ranchesTable } from "./ranches";
import { animalsTable } from "./animals";

export const famachaScoresTable = pgTable("famacha_scores", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animalsTable.id),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id),
  score: integer("score").notNull(), // 1-5
  recordedDate: text("recorded_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFamachaScoreSchema = createInsertSchema(famachaScoresTable).omit({ id: true, createdAt: true });
export type InsertFamachaScore = z.infer<typeof insertFamachaScoreSchema>;
export type FamachaScore = typeof famachaScoresTable.$inferSelect;
