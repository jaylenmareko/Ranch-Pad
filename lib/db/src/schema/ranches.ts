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
  // Billing
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"), // trialing | active | past_due | canceled | null
});

export const insertRanchSchema = createInsertSchema(ranchesTable).omit({ id: true, createdAt: true });
export type InsertRanch = z.infer<typeof insertRanchSchema>;
export type Ranch = typeof ranchesTable.$inferSelect;
