import { Router, type IRouter } from "express";
import {
  db,
  alertsTable,
  animalsTable,
  medicationRecordsTable,
  healthEventsTable,
  famachaScoresTable,
  ranchesTable,
  animalAssignmentsTable,
} from "@workspace/db";
import { eq, and, gte, lte, isNull, sql, desc } from "drizzle-orm";
import { requireAuth, requireNotViewer } from "../middlewares/auth.js";
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

  // 5. Calving/kidding due-date alerts (30 days before and on due date)
  for (const animal of animals) {
    if (!animal.expectedDueDate) continue;
    const dueDate = new Date(animal.expectedDueDate + "T12:00:00");
    const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Alert 30 days before
    if (daysUntil >= 28 && daysUntil <= 30) {
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

  const animals = await db
    .select()
    .from(animalsTable)
    .where(eq(animalsTable.ranchId, ranchId));

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

    // Build daily weather buckets
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

    const rawDays = Object.entries(days).slice(0, 5).map(([date, d]) => ({
      date,
      tempHigh: parseFloat(Math.max(...d.temps).toFixed(1)),
      tempLow: parseFloat(Math.min(...d.temps).toFixed(1)),
      avgHumidity: Math.round(d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length),
      maxWind: parseFloat(Math.max(...d.wind).toFixed(1)),
      totalRain: parseFloat(d.rain.toFixed(2)),
      conditions: [...new Set(d.desc)].join(", "),
    }));

    // Add day-over-day temperature deltas so Claude can detect sudden swings
    const summary = rawDays.map((day, i) => {
      if (i === 0) return { ...day, tempHighChange: null as number | null, tempLowChange: null as number | null };
      return {
        ...day,
        tempHighChange: parseFloat((day.tempHigh - rawDays[i - 1].tempHigh).toFixed(1)),
        tempLowChange: parseFloat((day.tempLow - rawDays[i - 1].tempLow).toFixed(1)),
      };
    });

    // Build animal inventory context grouped by species
    const today = new Date();
    const speciesMap: Record<string, {
      total: number;
      females: number;
      males: number;
      youngCount: number;
      dueSoon: string[];
    }> = {};

    for (const animal of animals) {
      if (!speciesMap[animal.species]) {
        speciesMap[animal.species] = { total: 0, females: 0, males: 0, youngCount: 0, dueSoon: [] };
      }
      const g = speciesMap[animal.species];
      g.total++;
      if (animal.sex === "Female") g.females++;
      else if (animal.sex === "Male") g.males++;

      if (animal.dateOfBirth) {
        const ageMonths = (today.getTime() - new Date(animal.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        if (ageMonths < 6) g.youngCount++;
      }

      if (animal.expectedDueDate) {
        const daysUntil = Math.floor(
          (new Date(animal.expectedDueDate + "T12:00:00").getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil >= 0 && daysUntil <= 30) {
          g.dueSoon.push(`${animal.name} (due in ${daysUntil} days)`);
        }
      }
    }

    const animalLines = Object.entries(speciesMap).map(([species, g]) => {
      let line = `- ${g.total} ${species}: ${g.females} female, ${g.males} male`;
      if (g.youngCount > 0) line += `, ${g.youngCount} under 6 months old`;
      if (g.dueSoon.length > 0) line += `, pregnant/due soon: ${g.dueSoon.join("; ")}`;
      return line;
    });

    const animalContext = animalLines.length > 0 ? animalLines.join("\n") : "No animals currently on record.";

    // Ask Claude for livestock risk analysis
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const prompt = `You are an expert livestock health advisor for small farmers and ranchers.
Analyze the 5-day weather forecast and the ranch's specific animal inventory to generate targeted disease risk alerts.

RANCH: ${ranch.name} (${ranch.locationCity ?? ""}, ${ranch.locationState ?? ""})

HERD INVENTORY (${animals.length} total animals):
${animalContext}

5-DAY WEATHER FORECAST (tempHighChange/tempLowChange = degrees vs previous day):
${JSON.stringify(summary, null, 2)}

SPECIES-SPECIFIC DISEASE KNOWLEDGE — only apply to species present in the inventory above:
- Cattle: Cold + wet + wind → Bovine Respiratory Disease (BRD/pneumonia), especially dangerous for calves under 6 months. A sudden high temperature drop >15°F across consecutive forecast days is a high-risk BRD trigger. Wet muddy conditions → foot rot risk.
- Goats & Sheep: Warm + humid (humidity >75%, temps >50°F) + rain → barber pole worm (Haemonchus contortus) larval surge on pasture — a leading cause of death in small ruminants. Cold + wet → pneumonia, especially kids/lambs. Goats are more cold-sensitive than cattle.
- Swine: Heat >80°F + high humidity → heat stress, reduced feed intake. Cold drafts + wet → PRRS and respiratory illness.
- All species: Temperature swings >20°F between consecutive forecast days = significant immune stress trigger. Sustained rain + mud → foot rot and hoof disease. Bright sunny + dry + dusty + windy conditions with temps above 55°F → pink eye (Infectious Keratoconjunctivitis); UV exposure, dust, and fly activity all increase transmission risk.
- Pregnant/due animals: Any cold, wet, or high-stress forecast conditions during the 30-day pre-calving/kidding window elevate dystocia and neonatal mortality risk substantially. Name these animals in the alert.

ALERT GENERATION RULES:
1. Only generate alerts for species present in the herd inventory — do not mention species not listed.
2. Use the actual animal counts in your message (e.g. "Your 8 cattle" or "3 of your goats"). For large groups, mention the financial scale of the risk.
3. Name individual animals in alerts when they face elevated personal risk (pregnant animals, young animals).
4. Flag temperature trend alerts explicitly when tempHighChange or tempLowChange shows a drop of 15°F or more.
5. Only generate alerts for genuine risks — no noise for mild or unremarkable conditions.

Severity:
- "low": Worth monitoring, no immediate action needed
- "medium": Take precautions this week, check animals daily
- "high": Act now — meaningful risk of illness or loss given forecast conditions

Return a JSON array of alerts (may be empty if no significant risks). Each alert must have:
- "alertType": "weather"
- "message": plain English, specific to this ranch's animals and actual forecast trends. A rancher should know exactly which animals to check and why.
- "severity": "low", "medium", or "high"
- "alertKey": unique string key (e.g., "weather_brd_cattle_2024-01-15")

Return valid JSON only, no extra text.`;

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
        alertType: "weather_forecast",
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
  const { userId, role } = req.user!;

  // No animals → no alerts
  const [hasAnimal] = await db
    .select({ id: animalsTable.id })
    .from(animalsTable)
    .where(eq(animalsTable.ranchId, ranchId))
    .limit(1);
  if (!hasAnimal) {
    res.json([]);
    return;
  }

  const alerts = await db
    .select()
    .from(alertsTable)
    .where(and(eq(alertsTable.ranchId, ranchId), eq(alertsTable.isDismissed, false)))
    .orderBy(alertsTable.generatedAt);

  // Attach animal names
  let result = await Promise.all(
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

  // Viewer: only show alerts tied to their assigned animals (no weather/global alerts)
  if (role === "viewer") {
    const assignments = await db
      .select({ animalId: animalAssignmentsTable.animalId })
      .from(animalAssignmentsTable)
      .where(and(eq(animalAssignmentsTable.ranchId, ranchId), eq(animalAssignmentsTable.viewerUserId, userId)));
    const assignedIds = new Set(assignments.map(a => a.animalId));
    result = result.filter(a => a.animalId !== null && assignedIds.has(a.animalId));
  }

  // Sort by severity: high -> medium -> low
  const severityOrder = { high: 0, medium: 1, low: 2 };
  result.sort((a, b) => (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) - (severityOrder[b.severity as keyof typeof severityOrder] ?? 3));

  res.json(result);
});

router.post("/alerts/generate", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;

  // No animals → skip generation entirely
  const [hasAnimal] = await db
    .select({ id: animalsTable.id })
    .from(animalsTable)
    .where(eq(animalsTable.ranchId, ranchId))
    .limit(1);
  if (!hasAnimal) {
    res.json({ created: 0, message: "No animals in herd — no alerts generated" });
    return;
  }

  const [recordCount, weatherCount] = await Promise.all([
    generateRecordAlerts(ranchId),
    generateWeatherAlerts(ranchId),
  ]);

  const created = recordCount + weatherCount;
  res.json({ created, message: `Generated ${created} new alert(s)` });
});

router.post("/alerts/:alertId/dismiss", requireAuth, requireNotViewer, async (req, res): Promise<void> => {
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
