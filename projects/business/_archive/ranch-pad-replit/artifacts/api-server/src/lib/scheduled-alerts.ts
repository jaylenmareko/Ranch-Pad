import { db, ranchesTable } from "@workspace/db";
import { generateRecordAlerts, generateWeatherAlerts } from "../routes/alerts.js";

export async function runScheduledAlerts(): Promise<void> {
  const ranches = await db.select({ id: ranchesTable.id }).from(ranchesTable);

  for (const ranch of ranches) {
    try {
      const [recordCount, weatherCount] = await Promise.all([
        generateRecordAlerts(ranch.id),
        generateWeatherAlerts(ranch.id),
      ]);
      if (recordCount + weatherCount > 0) {
        console.log(`[scheduled-alerts] Ranch ${ranch.id}: ${recordCount} record alert(s), ${weatherCount} weather alert(s)`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[scheduled-alerts] Ranch ${ranch.id} failed:`, message);
    }
  }
}
