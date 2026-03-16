import { Router, type IRouter } from "express";
import {
  db,
  alertsTable,
  animalsTable,
  medicationRecordsTable,
  healthEventsTable,
  famachaScoresTable,
  ranchesTable,
} from "@workspace/db";
import { eq, and, gte, lte, isNull, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

function parseId(param: string | string[]): number {
  return parseInt(Array.isArray(param) ? param[0] : param, 10);
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
  // Check if a non-dismissed alert with this key already exists today
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

  if (existing.length > 0) return false; // Already exists, skip

  await db.insert(alertsTable).values({
    ...alert,
    isDismissed: false,
  });
  return true;
}

// --- Record-based alert generation ---
async function generateRecordAlerts(ranchId: number): Promise<number> {
  let created = 0;
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const animals = await db
    .select()
    .from(animalsTable)
    .where(eq(animalsTable.ranchId, ranchId));

  // 1. Overdue medications
  for (const animal of animals) {
    const medications = await db
      .select()
      .from(medicationRecordsTable)
      .where(eq(medicationRecordsTable.animalId, animal.id));

    for (const med of medications) {
      if (med.nextDueDate && med.nextDueDate < todayStr) {
        const key = makeKey("overdue_med", animal.id, med.id);
        const wasCreated = await upsertAlert({
          ranchId,
          animalId: animal.id,
          alertType: "record",
          alertKey: key,
          message: `${animal.name} is overdue for ${med.medicationName} (due ${med.nextDueDate})`,
          severity: "medium",
        });
        if (wasCreated) created++;
      }
    }
  }

  // 2. Repeat health flags: 3+ health events in last 30 days
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  for (const animal of animals) {
    const recentEvents = await db
      .select()
      .from(healthEventsTable)
      .where(
        and(
          eq(healthEventsTable.animalId, animal.id),
          gte(healthEventsTable.eventDate, thirtyDaysAgoStr)
        )
      );

    if (recentEvents.length >= 3) {
      const key = makeKey("repeat_health", animal.id, new Date().getFullYear(), new Date().getMonth());
      const wasCreated = await upsertAlert({
        ranchId,
        animalId: animal.id,
        alertType: "record",
        alertKey: key,
        message: `${animal.name} has had ${recentEvents.length} health events in the last 30 days — consider a vet visit`,
        severity: "high",
      });
      if (wasCreated) created++;
    }
  }

  // 3. Declining FAMACHA trends: last 3 scores consistently worsening (increasing)
  for (const animal of animals) {
    const scores = await db
      .select()
      .from(famachaScoresTable)
      .where(eq(famachaScoresTable.animalId, animal.id))
      .orderBy(famachaScoresTable.recordedDate);

    if (scores.length >= 3) {
      const last3 = scores.slice(-3);
      // Scores increase means worsening (1 best, 5 worst)
      if (last3[0].score < last3[1].score && last3[1].score < last3[2].score) {
        const key = makeKey("famacha_decline", animal.id, last3[2].id);
        const wasCreated = await upsertAlert({
          ranchId,
          animalId: animal.id,
          alertType: "record",
          alertKey: key,
          message: `${animal.name}'s FAMACHA scores are declining (${last3.map(s => s.score).join(" → ")}) — check for barber pole worm`,
          severity: "high",
        });
        if (wasCreated) created++;
      }
    }
  }

  // 4. Heat cycle reminders for females
  // Cattle ~21 days, goats ~21 days, sheep ~17 days
  const femaleAnimals = animals.filter(a =>
    ["Female"].includes(a.sex) &&
    ["Cattle", "Goat", "Sheep"].includes(a.species)
  );

  for (const animal of femaleAnimals) {
    const cycleDays = animal.species === "Sheep" ? 17 : 21;

    // Get the latest health event tagged as heat-related, or just use creation date as approximate last cycle
    // We'll check if it's been cycleDays since the last "heat" field note or event
    // For simplicity, alert every cycleDays from the animal's last health event or creation
    const lastEvent = await db
      .select()
      .from(healthEventsTable)
      .where(eq(healthEventsTable.animalId, animal.id))
      .orderBy(desc(healthEventsTable.eventDate))
      .limit(1);

    const referenceDate = lastEvent.length > 0 ? new Date(lastEvent[0].eventDate) : new Date(animal.createdAt);
    const daysSince = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince >= cycleDays && daysSince % cycleDays <= 2) {
      const cycleNumber = Math.floor(daysSince / cycleDays);
      const key = makeKey("heat_cycle", animal.id, cycleNumber);
      const wasCreated = await upsertAlert({
        ranchId,
        animalId: animal.id,
        alertType: "record",
        alertKey: key,
        message: `${animal.name} (${animal.species}) may be entering her heat cycle (~${cycleDays}-day cycle)`,
        severity: "low",
      });
      if (wasCreated) created++;
    }
  }

  // 5. Calving/kidding due-date alerts (2 weeks before and on due date)
  for (const animal of animals) {
    if (!animal.expectedDueDate) continue;
    const dueDate = new Date(animal.expectedDueDate + "T12:00:00");
    const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Alert 14 days before
    if (daysUntil >= 12 && daysUntil <= 14) {
      const key = makeKey("calving_soon", animal.id, animal.expectedDueDate);
      const wasCreated = await upsertAlert({
        ranchId, animalId: animal.id, alertType: "record",
        alertKey: key,
        message: `${animal.name} is due to calve/kid in ~${daysUntil} days (${animal.expectedDueDate}) — prepare birthing area`,
        severity: "medium",
      });
      if (wasCreated) created++;
    }

    // Alert on due date
    if (daysUntil >= -1 && daysUntil <= 1) {
      const key = makeKey("calving_due", animal.id, animal.expectedDueDate);
      const wasCreated = await upsertAlert({
        ranchId, animalId: animal.id, alertType: "record",
        alertKey: key,
        message: `${animal.name} is due to calve/kid today (${animal.expectedDueDate}) — monitor closely`,
        severity: "high",
      });
      if (wasCreated) created++;
    }
  }

  return created;
}

// --- Weather-based AI alert generation ---
async function generateWeatherAlerts(ranchId: number): Promise<number> {
  const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!OPENWEATHERMAP_API_KEY || !ANTHROPIC_API_KEY) return 0;

  const [ranch] = await db
    .select()
    .from(ranchesTable)
    .where(eq(ranchesTable.id, ranchId))
    .limit(1);

  if (!ranch || ranch.lat == null || ranch.lon == null) return 0;

  try {
    // Fetch forecast from OpenWeatherMap
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${ranch.lat}&lon=${ranch.lon}&appid=${OPENWEATHERMAP_API_KEY}&units=imperial&cnt=40`;
    const forecastResp = await fetch(forecastUrl);
    if (!forecastResp.ok) return 0;

    const forecastData = (await forecastResp.json()) as {
      list: Array<{
        main: { temp: number; humidity: number };
        weather: Array<{ description: string }>;
        wind: { speed: number };
        rain?: { "3h": number };
        dt_txt: string;
      }>;
    };

    // Build structured weather summary for Claude
    const days: Record<string, { temps: number[]; humidity: number[]; wind: number[]; rain: number; desc: string[] }> = {};
    for (const entry of forecastData.list) {
      const date = entry.dt_txt.split(" ")[0];
      if (!days[date]) days[date] = { temps: [], humidity: [], wind: [], rain: 0, desc: [] };
      days[date].temps.push(entry.main.temp);
      days[date].humidity.push(entry.main.humidity);
      days[date].wind.push(entry.wind.speed);
      days[date].rain += entry.rain?.["3h"] ?? 0;
      days[date].desc.push(entry.weather[0]?.description ?? "");
    }

    const summary = Object.entries(days).slice(0, 5).map(([date, d]) => ({
      date,
      tempHigh: Math.max(...d.temps).toFixed(1),
      tempLow: Math.min(...d.temps).toFixed(1),
      avgHumidity: Math.round(d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length),
      maxWind: Math.max(...d.wind).toFixed(1),
      totalRain: d.rain.toFixed(2),
      conditions: [...new Set(d.desc)].join(", "),
    }));

    // Ask Claude for livestock risk analysis
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const prompt = `You are an expert livestock health advisor for small farmers and ranchers. 
Analyze the following 5-day weather forecast and identify any health risks for livestock.

Weather forecast for ${ranch.name} (${ranch.locationCity ?? ""}, ${ranch.locationState ?? ""}):
${JSON.stringify(summary, null, 2)}

Assess risk for:
- Barber pole worm and parasite pressure (warm + wet conditions favor larvae)
- Respiratory illness (cold + wet + windy conditions)
- Foot rot (wet + muddy conditions)
- Heat stress (high temperatures + humidity)
- Hypothermia risk for young animals (cold + wet)

Return a JSON array of alerts (may be empty if no significant risks). Each alert must have:
- "alertType": "weather"
- "message": plain English message a farmer would understand (be specific about the risk and what to watch for)
- "severity": one of "low", "medium", or "high"
- "alertKey": a unique string key for this alert (e.g., "weather_respiratory_2024-01-15")

Only generate alerts for genuine risks based on the forecast data. Return valid JSON only, no extra text.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") return 0;

    let parsedAlerts: Array<{
      alertType: string;
      message: string;
      severity: string;
      alertKey: string;
    }>;

    try {
      // Extract JSON from response (Claude may wrap in code blocks)
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return 0;
      parsedAlerts = JSON.parse(jsonMatch[0]);
    } catch {
      return 0;
    }

    let created = 0;
    for (const alert of parsedAlerts) {
      if (!alert.message || !alert.severity || !alert.alertKey) continue;
      const wasCreated = await upsertAlert({
        ranchId,
        animalId: null,
        alertType: "weather",
        alertKey: `weather_${alert.alertKey}`,
        message: alert.message,
        severity: alert.severity,
      });
      if (wasCreated) created++;
    }
    return created;
  } catch (err) {
    console.error("Weather alert generation failed:", err);
    return 0;
  }
}

// --- Routes ---

router.get("/alerts", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;

  const alerts = await db
    .select()
    .from(alertsTable)
    .where(and(eq(alertsTable.ranchId, ranchId), eq(alertsTable.isDismissed, false)))
    .orderBy(alertsTable.generatedAt);

  // Attach animal names
  const result = await Promise.all(
    alerts.map(async alert => {
      let animalName: string | null = null;
      if (alert.animalId) {
        const [animal] = await db
          .select({ name: animalsTable.name })
          .from(animalsTable)
          .where(eq(animalsTable.id, alert.animalId))
          .limit(1);
        animalName = animal?.name ?? null;
      }
      return { ...alert, animalName };
    })
  );

  // Sort by severity: high -> medium -> low
  const severityOrder = { high: 0, medium: 1, low: 2 };
  result.sort((a, b) => (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) - (severityOrder[b.severity as keyof typeof severityOrder] ?? 3));

  res.json(result);
});

router.post("/alerts/generate", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;

  const [recordCount, weatherCount] = await Promise.all([
    generateRecordAlerts(ranchId),
    generateWeatherAlerts(ranchId),
  ]);

  const created = recordCount + weatherCount;
  res.json({ created, message: `Generated ${created} new alert(s)` });
});

router.post("/alerts/:alertId/dismiss", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const alertId = parseId(req.params.alertId);

  const [alert] = await db
    .update(alertsTable)
    .set({ isDismissed: true })
    .where(and(eq(alertsTable.id, alertId), eq(alertsTable.ranchId, ranchId)))
    .returning();

  if (!alert) {
    res.status(404).json({ error: true, message: "Alert not found" });
    return;
  }

  res.json({ ...alert, animalName: null });
});

export { generateRecordAlerts, generateWeatherAlerts };
export default router;
