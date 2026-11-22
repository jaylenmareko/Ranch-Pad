import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ranchesTable } from "./ranches";
import { animalsTable } from "./animals";

export const healthEventsTable = pgTable("health_events", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animalsTable.id),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id),
  description: text("description").notNull(),
  eventDate: text("event_date").notNull(),
  severity: text("severity").notNull(), // low, medium, high
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHealthEventSchema = createInsertSchema(healthEventsTable).omit({ id: true, createdAt: true });
export type InsertHealthEvent = z.infer<typeof insertHealthEventSchema>;
export type HealthEvent = typeof healthEventsTable.$inferSelect;
