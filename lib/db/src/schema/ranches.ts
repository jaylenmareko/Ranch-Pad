import { pgTable, text, serial, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ranchesTable = pgTable("ranches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  locationCity: text("location_city"),
  locationState: text("location_state"),
  lat: doublePrecision("lat"),
  lon: doublePrecision("lon"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRanchSchema = createInsertSchema(ranchesTable).omit({ id: true, createdAt: true });
export type InsertRanch = z.infer<typeof insertRanchSchema>;
export type Ranch = typeof ranchesTable.$inferSelect;
