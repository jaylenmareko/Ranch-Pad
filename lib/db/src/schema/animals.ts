import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ranchesTable } from "./ranches";

export const animalsTable = pgTable("animals", {
  id: serial("id").primaryKey(),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id),
  name: text("name").notNull(),
  tagNumber: text("tag_number"),
  species: text("species").notNull(),
  breed: text("breed"),
  sex: text("sex").notNull(),
  dateOfBirth: text("date_of_birth"),
  damId: integer("dam_id"),
  sireId: integer("sire_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnimalSchema = createInsertSchema(animalsTable).omit({ id: true, createdAt: true });
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animalsTable.$inferSelect;
