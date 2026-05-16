import { pgTable, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { ranchesTable } from "./ranches";
import { usersTable } from "./users";
import { animalsTable } from "./animals";

export const animalAssignmentsTable = pgTable("animal_assignments", {
  id: serial("id").primaryKey(),
  ranchId: integer("ranch_id").notNull().references(() => ranchesTable.id),
  animalId: integer("animal_id").notNull().references(() => animalsTable.id, { onDelete: "cascade" }),
  viewerUserId: integer("viewer_user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AnimalAssignment = typeof animalAssignmentsTable.$inferSelect;
