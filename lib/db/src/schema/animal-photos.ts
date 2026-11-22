import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { healthEventsTable } from "./health-events";
import { medicationRecordsTable } from "./medication-records";

export const animalPhotosTable = pgTable("animal_photos", {
  id: serial("id").primaryKey(),
  healthEventId: integer("health_event_id").references(() => healthEventsTable.id, { onDelete: "cascade" }),
  medicationRecordId: integer("medication_record_id").references(() => medicationRecordsTable.id, { onDelete: "cascade" }),
  objectPath: text("object_path").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AnimalPhoto = typeof animalPhotosTable.$inferSelect;
