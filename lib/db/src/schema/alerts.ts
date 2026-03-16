import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ranchesTable } from "./ranches";
import { animalsTable } from "./animals";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id),
  animalId: integer("animal_id").references(() => animalsTable.id),
  alertType: text("alert_type").notNull(),
  alertKey: text("alert_key").notNull(), // deterministic key for idempotency
  message: text("message").notNull(),
  severity: text("severity").notNull(), // low, medium, high
  isDismissed: boolean("is_dismissed").notNull().default(false),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, generatedAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
