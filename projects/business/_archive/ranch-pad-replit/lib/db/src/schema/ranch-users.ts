import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ranchesTable } from "./ranches";
import { usersTable } from "./users";

export const ranchUsersTable = pgTable("ranch_users", {
  id: serial("id").primaryKey(),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRanchUserSchema = createInsertSchema(ranchUsersTable).omit({ id: true, createdAt: true });
export type InsertRanchUser = z.infer<typeof insertRanchUserSchema>;
export type RanchUser = typeof ranchUsersTable.$inferSelect;
