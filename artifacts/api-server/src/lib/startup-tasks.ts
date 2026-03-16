import { db, ranchesTable, alertsTable, animalsTable, medicationRecordsTable, healthEventsTable, famachaScoresTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";

export async function checkDbConnectivity(): Promise<void> {
  await db.select({ count: sql<number>`count(*)` }).from(ranchesTable).limit(1);
}

function makeKey(...parts: (string | number | null | undefined)[]): string {
  return parts.map(String).join("|");
}

async function upsertAlert(alert: {
  ranchId: number;
  animalId?: number | null;
  alertType: string;
  alertKey: string;
  message: string;
  severity: string;
}): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const existing = await db
    .select({ id: alertsTable.id })
    .from(alertsTable)
    .where(
      and(
        eq(alertsTable.ranchId, alert.ranchId),
        eq(alertsTable.alertKey, alert.alertKey),
        eq(alertsTable.isDismissed, false),
        sql`DATE(${alertsTable.generatedAt}) = ${today}`
      )
    )
    .limit(1);

  if (existing.length > 0) return false;

  await db.insert(alertsTable).values({ ...alert, isDismissed: false });
  return true;
}

export async function generateAlertsForAllRanches(): Promise<void> {
  const ranches = await db.select({ id: ranchesTable.id }).from(ranchesTable);
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  for (const ranch of ranches) {
    const ranchId = ranch.id;
    const animals = await db.select().from(animalsTable).where(eq(animalsTable.ranchId, ranchId));

    for (const animal of animals) {
      const medications = await db
        .select()
        .from(medicationRecordsTable)
        .where(eq(medicationRecordsTable.animalId, animal.id));

      for (const med of medications) {
        if (med.nextDueDate && med.nextDueDate < todayStr) {
          await upsertAlert({
            ranchId, animalId: animal.id, alertType: "record",
            alertKey: makeKey("overdue_med", animal.id, med.id),
            message: `${animal.name} is overdue for ${med.medicationName} (due ${med.nextDueDate})`,
            severity: "medium",
          });
        }
      }

      const recentEvents = await db
        .select()
        .from(healthEventsTable)
        .where(and(eq(healthEventsTable.animalId, animal.id), gte(healthEventsTable.eventDate, thirtyDaysAgoStr)));

      if (recentEvents.length >= 3) {
        await upsertAlert({
          ranchId, animalId: animal.id, alertType: "record",
          alertKey: makeKey("repeat_health", animal.id, new Date().getFullYear(), new Date().getMonth()),
          message: `${animal.name} has had ${recentEvents.length} health events in the last 30 days — consider a vet visit`,
          severity: "high",
        });
      }

      const scores = await db
        .select()
        .from(famachaScoresTable)
        .where(eq(famachaScoresTable.animalId, animal.id))
        .orderBy(famachaScoresTable.recordedDate);

      if (scores.length >= 3) {
        const last3 = scores.slice(-3);
        if (last3[0].score < last3[1].score && last3[1].score < last3[2].score) {
          await upsertAlert({
            ranchId, animalId: animal.id, alertType: "record",
            alertKey: makeKey("famacha_decline", animal.id, last3[2].id),
            message: `${animal.name}'s FAMACHA score is declining (${last3.map(s => s.score).join('→')}) — parasite treatment recommended`,
            severity: "high",
          });
        }
      }
    }
  }
}
