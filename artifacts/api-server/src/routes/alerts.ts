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
import { eq, and, gte, isNull, sql, desc } from "drizzle-orm";
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
  summary?: string | null;
  message: string;
  severity: string;
}): Promise<boolean> {
  // Two-part dedup:
  // 1. If a non-dismissed alert with this key exists (any date) → it's already on the list, skip.
  // 2. If a dismissed alert with this key was generated today → don't resurrect it same day.
  const today = new Date().toISOString().split("T")[0];
  const existing = await db
    .select({ id: alertsTable.id, isDismissed: alertsTable.isDismissed })
    .from(alertsTable)
    .where(
      and(
        eq(alertsTable.ranchId, alert.ranchId),
        eq(alertsTable.alertKey, alert.alertKey)
      )
    )
    .orderBy(alertsTable.generatedAt)
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];
    // Active alert already on the list — never duplicate it
    if (!row.isDismissed) {
      console.log(`[upsertAlert] Skipped (already active): key="${alert.alertKey}" ranch=${alert.ranchId}`);
      return false;
    }
    // Dismissed today — don't bring it back until tomorrow
    if (row.isDismissed) {
      const [dismissedRow] = await db
        .select({ generatedAt: alertsTable.generatedAt })
        .from(alertsTable)
        .where(
          and(
            eq(alertsTable.ranchId, alert.ranchId),
            eq(alertsTable.alertKey, alert.alertKey),
            eq(alertsTable.isDismissed, true),
            sql`DATE(${alertsTable.generatedAt}) = ${today}`
          )
        )
        .limit(1);
      if (dismissedRow) {
        console.log(`[upsertAlert] Skipped (dismissed today): key="${alert.alertKey}" ranch=${alert.ranchId}`);
        return false;
      }
    }
  }

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

  const animals = await db
    .select()
    .from(animalsTable)
    .where(and(eq(animalsTable.ranchId, ranchId), isNull(animalsTable.archivedAt)));

  // 1. Recent high-severity health events (last 14 days)
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split("T")[0];

  for (const animal of animals) {
    const severeEvents = await db
      .select()
      .from(healthEventsTable)
      .where(
        and(
          eq(healthEventsTable.animalId, animal.id),
          gte(healthEventsTable.eventDate, fourteenDaysAgoStr),
          sql`LOWER(${healthEventsTable.severity}) IN ('high', 'critical')`
        )
      );

    for (const event of severeEvents) {
      const key = makeKey("severe_health_event", animal.id, event.id);
      const wasCreated = await upsertAlert({
        ranchId,
        animalId: animal.id,
        alertType: "record",
        alertKey: key,
        message: `${animal.name} had a high-severity health event on ${event.eventDate}: ${event.description}`,
        severity: "high",
      });
      if (wasCreated) created++;
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

  return created;
}

// --- Weather-based AI alert generation ---
async function generateWeatherAlerts(ranchId: number): Promise<number> {
  console.log(`[weather-alerts] ▶ generateWeatherAlerts called for ranch ${ranchId}`);

  const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!OPENWEATHERMAP_API_KEY || !ANTHROPIC_API_KEY) {
    console.warn(`[weather-alerts] Ranch ${ranchId}: Missing API keys — OPENWEATHERMAP_API_KEY=${!!OPENWEATHERMAP_API_KEY} ANTHROPIC_API_KEY=${!!ANTHROPIC_API_KEY} — skipping`);
    return 0;
  }

  const [ranch] = await db
    .select()
    .from(ranchesTable)
    .where(eq(ranchesTable.id, ranchId))
    .limit(1);

  if (!ranch) {
    console.warn(`[weather-alerts] Ranch ${ranchId}: Not found in database — skipping`);
    return 0;
  }

  if (ranch.lat == null || ranch.lon == null) {
    console.warn(`[weather-alerts] Ranch ${ranchId} ("${ranch.name}"): No coordinates set (lat=${ranch.lat}, lon=${ranch.lon}) — go to Settings → Ranch Info → enter your address to enable weather alerts`);
    return 0;
  }

  console.log(`[weather-alerts] Ranch ${ranchId} ("${ranch.name}") at lat=${ranch.lat} lon=${ranch.lon} — proceeding`);

  const animals = await db
    .select()
    .from(animalsTable)
    .where(and(eq(animalsTable.ranchId, ranchId), isNull(animalsTable.archivedAt)));

  console.log(`[weather-alerts] Ranch ${ranchId}: ${animals.length} active animals`);

  // Fetch individual health records for all animals on this ranch in parallel
  const cutoffBase = new Date();
  const thirtyDaysAgo = new Date(cutoffBase.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const ninetyDaysAgo  = new Date(cutoffBase.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [recentHealthEvents, recentMeds, recentFamacha] = await Promise.all([
    db.select().from(healthEventsTable)
      .where(and(eq(healthEventsTable.ranchId, ranchId), gte(healthEventsTable.eventDate, thirtyDaysAgo))),
    db.select().from(medicationRecordsTable)
      .where(and(eq(medicationRecordsTable.ranchId, ranchId), gte(medicationRecordsTable.dateGiven, thirtyDaysAgo))),
    db.select().from(famachaScoresTable)
      .where(and(eq(famachaScoresTable.ranchId, ranchId), gte(famachaScoresTable.recordedDate, ninetyDaysAgo))),
  ]);

  console.log(`[weather-alerts] Ranch ${ranchId}: DB records — ${recentHealthEvents.length} health events (30d), ${recentMeds.length} medications (30d), ${recentFamacha.length} FAMACHA scores (90d)`);

  try {
    // Fetch forecast + current observed conditions in parallel
    const [forecastResp, currentResp] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${ranch.lat}&lon=${ranch.lon}&appid=${OPENWEATHERMAP_API_KEY}&units=imperial&cnt=40`),
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${ranch.lat}&lon=${ranch.lon}&appid=${OPENWEATHERMAP_API_KEY}&units=imperial`),
    ]);

    console.log(`[weather-alerts] Ranch ${ranchId}: Forecast API → HTTP ${forecastResp.status}; Current weather API → HTTP ${currentResp.status}`);

    if (!forecastResp.ok) {
      const errBody = await forecastResp.text().catch(() => "(unreadable)");
      console.error(`[weather-alerts] Ranch ${ranchId}: Forecast API failed (${forecastResp.status}): ${errBody.slice(0, 300)}`);
      return 0;
    }

    const forecastData = (await forecastResp.json()) as {
      list: Array<{
        main: { temp: number; humidity: number };
        weather: Array<{ description: string }>;
        wind: { speed: number };
        rain?: { "3h": number };
        dt_txt: string;
      }>;
    };

    // Build daily weather buckets from the forecast
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
      rainfallInches: parseFloat((d.rain / 25.4).toFixed(2)),
      conditions: [...new Set(d.desc)].join(", "),
    }));

    // Parse current observed conditions to anchor the trend
    type WeatherDay = {
      date: string; label?: string;
      tempHigh: number; tempLow: number; avgHumidity: number; maxWind: number; rainfallInches: number;
      conditions: string; tempHighChange: number | null; tempLowChange: number | null;
    };
    let observedToday: WeatherDay | null = null;
    if (currentResp.ok) {
      const cw = await currentResp.json() as {
        main: { temp: number; temp_max: number; temp_min: number; humidity: number };
        wind: { speed: number };
        weather: Array<{ description: string }>;
        rain?: { "1h"?: number; "3h"?: number };
      };
      observedToday = {
        date: new Date().toISOString().split("T")[0],
        label: "observed_today",
        tempHigh: parseFloat(cw.main.temp_max.toFixed(1)),
        tempLow: parseFloat(cw.main.temp_min.toFixed(1)),
        avgHumidity: cw.main.humidity,
        maxWind: parseFloat(cw.wind.speed.toFixed(1)),
        rainfallInches: parseFloat(((cw.rain?.["1h"] ?? cw.rain?.["3h"] ?? 0) / 25.4).toFixed(2)),
        conditions: cw.weather[0]?.description ?? "",
        tempHighChange: null,
        tempLowChange: null,
      };
    }

    // Day-over-day deltas — forecast day 1 delta is vs. observed today (if available)
    const forecastWithDeltas: WeatherDay[] = rawDays.map((day, i) => {
      const prev = i === 0 ? observedToday : rawDays[i - 1];
      return {
        ...day,
        tempHighChange: prev ? parseFloat((day.tempHigh - prev.tempHigh).toFixed(1)) : null,
        tempLowChange:  prev ? parseFloat((day.tempLow  - prev.tempLow ).toFixed(1)) : null,
      };
    });
    const summary: WeatherDay[] = observedToday ? [observedToday, ...forecastWithDeltas] : forecastWithDeltas;

    // Build herd inventory summary grouped by species
    const today = new Date();
    const speciesMap: Record<string, {
      total: number; females: number; males: number; youngCount: number; dueSoon: string[];
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

    // Build per-animal risk profiles indexed by animal ID
    const eventsByAnimal = new Map<number, typeof recentHealthEvents>();
    for (const ev of recentHealthEvents) {
      if (!eventsByAnimal.has(ev.animalId)) eventsByAnimal.set(ev.animalId, []);
      eventsByAnimal.get(ev.animalId)!.push(ev);
    }
    const medsByAnimal = new Map<number, typeof recentMeds>();
    for (const med of recentMeds) {
      if (!medsByAnimal.has(med.animalId)) medsByAnimal.set(med.animalId, []);
      medsByAnimal.get(med.animalId)!.push(med);
    }
    const famachaByAnimal = new Map<number, typeof recentFamacha>();
    for (const fs of recentFamacha) {
      if (!famachaByAnimal.has(fs.animalId)) famachaByAnimal.set(fs.animalId, []);
      famachaByAnimal.get(fs.animalId)!.push(fs);
    }

    const profileLines: string[] = [];
    for (const animal of animals) {
      const events  = eventsByAnimal.get(animal.id) ?? [];
      const meds    = medsByAnimal.get(animal.id) ?? [];
      const famacha = (famachaByAnimal.get(animal.id) ?? [])
        .sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));

      // Only include animals that have at least some health data
      const hasFamacha = famacha.length > 0;
      const hasEvents  = events.length > 0;
      const hasMeds    = meds.length > 0;
      const isDueSoon  = animal.expectedDueDate
        ? Math.floor((new Date(animal.expectedDueDate + "T12:00:00").getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) <= 60
        : false;

      if (!hasEvents && !hasMeds && !hasFamacha && !isDueSoon) continue;

      const tag = animal.tagNumber ? `Tag #${animal.tagNumber}` : "No tag";
      const age = animal.dateOfBirth
        ? `${Math.round((today.getTime() - new Date(animal.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44))} months old`
        : null;

      let profile = `• ${tag} — ${animal.name} | ${animal.species}${animal.breed ? ` (${animal.breed})` : ""} | ${animal.sex}`;
      if (age) profile += ` | ${age}`;
      if (isDueSoon && animal.expectedDueDate) {
        const daysUntil = Math.floor((new Date(animal.expectedDueDate + "T12:00:00").getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        profile += ` | DUE IN ${daysUntil} DAYS`;
      }

      if (hasEvents) {
        const sorted = events.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
        profile += `\n  Health events (last 30d): ${sorted.map(e => `[${e.eventDate}, ${e.severity}] ${e.description}`).join(" | ")}`;
      }

      if (hasMeds) {
        const sorted = meds.sort((a, b) => b.dateGiven.localeCompare(a.dateGiven));
        profile += `\n  Medications: ${sorted.map(m => `${m.medicationName}${m.dosage ? " " + m.dosage : ""} (given ${m.dateGiven}${m.nextDueDate ? ", next due " + m.nextDueDate : ""})`).join(" | ")}`;
      }

      if (hasFamacha) {
        const scores = famacha.map(f => f.score);
        const trend = scores.length >= 2
          ? scores[scores.length - 1] > scores[0] ? "worsening" : scores[scores.length - 1] < scores[0] ? "improving" : "stable"
          : "single reading";
        profile += `\n  FAMACHA scores: ${scores.join(" → ")} (${trend})`;
      }

      profileLines.push(profile);
    }

    console.log(`[weather-alerts] Ranch ${ranchId}: ${profileLines.length} animals have health history (out of ${animals.length} total)`);
    if (profileLines.length > 0) {
      console.log(`[weather-alerts] Ranch ${ranchId}: First animal profile sample:\n${profileLines[0]}`);
    }

    // Prioritize the most critical animals first, cap at 30 to avoid token overflow
    // Priority: FAMACHA ≥ 3 first, then high-severity events, then due-soon, then rest
    profileLines.sort((a) => {
      const hasCriticalFamacha = /FAMACHA scores:.*[45]/.test(a);
      const hasHighEvent = /\[.*high\]/.test(a);
      if (hasCriticalFamacha) return -1;
      if (hasHighEvent) return -1;
      return 0;
    });
    const cappedProfiles = profileLines.slice(0, 30);
    if (profileLines.length > 30) {
      cappedProfiles.push(`... and ${profileLines.length - 30} more animals with health records (shown above are the highest-priority).`);
    }

    const animalProfiles = cappedProfiles.length > 0
      ? cappedProfiles.join("\n")
      : "No individual health records on file for any animal in the last 30–90 days.";

    // Fetch recent weather alerts for this ranch (last 48 h) to inform dedup rule
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentWeatherAlerts = await db
      .select({
        alertKey: alertsTable.alertKey,
        severity: alertsTable.severity,
        summary: alertsTable.summary,
        generatedAt: alertsTable.generatedAt,
        isDismissed: alertsTable.isDismissed,
      })
      .from(alertsTable)
      .where(
        and(
          eq(alertsTable.ranchId, ranchId),
          eq(alertsTable.alertType, "weather_forecast"),
          gte(alertsTable.generatedAt, fortyEightHoursAgo),
        )
      )
      .orderBy(desc(alertsTable.generatedAt));

    const recentAlertsContext = recentWeatherAlerts.length > 0
      ? recentWeatherAlerts
          .map(a => `- [${a.isDismissed ? "DISMISSED" : "ACTIVE"}] key="${a.alertKey}" | ${a.severity} | ${a.summary ?? "(no summary)"}`)
          .join("\n")
      : "None";

    // Ask Claude for livestock risk analysis
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const location = [ranch.locationCity, ranch.locationState].filter(Boolean).join(", ") || `lat ${ranch.lat}, lon ${ranch.lon}`;

    const prompt = `You are generating livestock weather-risk alerts for a working rancher. Write like you are a trusted neighbor who ranches — plain, direct, no fluff.

YOUR MISSION: Only issue an alert when the forecast creates a specific, measurable reason to act. Zero alerts is a correct outcome when conditions are normal.

DATA NOTES:
- "observed_today": actual conditions at the ranch right now
- Remaining entries: 5-day forecast. tempHighChange/tempLowChange = change vs prior day (negative = cooling)
- rainfallInches: total inches of rain for that day (e.g. 0.80 = just under an inch)
- Each animal profile includes health events, medications, and FAMACHA scores from the last 30–90 days

RANCH: ${ranch.name} — ${location}

HERD INVENTORY (${animals.length} total):
${animalContext}

INDIVIDUAL ANIMAL RISK PROFILES:
${animalProfiles}

CURRENT + FORECAST WEATHER (JSON):
${JSON.stringify(summary, null, 2)}

ALERTS ALREADY ISSUED IN THE LAST 48 HOURS:
${recentAlertsContext}

DISEASE TRIGGERS — only apply to species present in this herd:
- Cattle: Temps dropping >15°F between days + wet/wind → pneumonia. Calves under 6 months or animals with a logged respiratory illness are critical risk. Wet mud → foot rot. Dusty/windy + above 55°F → pinkeye.
- Sheep & Goats: Forecast temps >45°F + humidity >70% + any rain = barber pole worm larvae on pasture. FAMACHA ≥3 or recent worm treatment = high or critical individual risk. Cold + wet nights → pneumonia in young animals. Wet pasture → foot scald and foot rot.
- Horses: Prolonged wet legs → mud fever. Warm humid stretch → rain rot. Only flag animals with a logged treatment for either.
- Swine: Heat >80°F + humidity → heat stress. Cold + wet drafts → respiratory illness.
- All species: Temp swing >20°F between consecutive days = immune suppression risk. Always cite the exact °F numbers.

FIVE STRICT RULES:

RULE 1 — ZERO ALERTS IS VALID. No meaningful risk? Return []. Do not pad output.

RULE 2 — CITE EXACT DATA. Every alert must name a specific number from the forecast (a temp, a humidity %, an inches value). No data point = no alert.

RULE 3 — SPECIES IN THIS HERD ONLY. No sheep/goats = no barber pole worm alert. No horses = no mud fever alert.

RULE 4 — INDIVIDUAL ALERTS NEED DOCUMENTED HISTORY. Only name a specific animal if their profile has a logged health event or treatment that directly relates to the risk. Breed or age alone is not enough.

RULE 5 — NO DUPLICATES. If an ACTIVE alert for the same risk and species already exists in the last 48 hours, skip it. If a DISMISSED alert covers the same risk and the forecast has not shifted more than 5°F or 15% humidity, skip it.

LANGUAGE RULES — strictly enforced:
- Write like you're leaving a voicemail for a neighbor who ranches. Short sentences. No textbook terms.
- BANNED words/phrases: Haemonchus contortus, H. contortus, larval activation, hypoproteinemia, physiological recovery, Fusobacterium necrophorum, rectal temperature, mucous membranes, clinical signs, targeted selective treatment, immunocompromised, cardiovascular reserves. Say the plain word instead: "barber pole worm larvae", "bottle jaw from blood loss", "pale gums", "check temperature", "immune system", "recovery".
- alertKey: stable, no dates — e.g. "barber_pole_sheep_herd", "pneumonia_cattle_herd", "barber_pole_mae_t105"
- Severity: "low" = worth watching; "moderate" = take action this week; "high" = act within 24 hours; "critical" = act today, name the animal.

FORMAT — hard limits, no exceptions:
- summary: 1–2 sentences max. Lead with the action. "SEVERITY — [Who]: [what to do]. [One plain reason why]."
- message: HARD STOP at 3 sentences. No more. Sentence 1 = what to do. Sentence 2 = the specific forecast numbers that triggered this. Sentence 3 = why this animal or herd is higher risk, based only on what is in the logged records.
- Do not repeat information across summary and message — they are read together.
- Do not list multiple actions — one clear action per alert.

Return ONLY a valid JSON array. No markdown, no explanation outside the array. Return [] for no alerts.
Each object: {"alertType":"weather","summary":"...","message":"...","severity":"...","alertKey":"..."}

EXAMPLE of correct output:
[{"alertType":"weather","summary":"HIGH — Mae (Nubian Goat, #T-105): Check her FAMACHA score today and consider retreatment if she scores 3 or higher. Warm wet weather coming will bring barber pole worm larvae up on pasture.","message":"Pull Mae off wet pasture today and check her FAMACHA score. Temps are staying above 65°F with 80% humidity and 0.9 inches of rain forecast Wednesday — prime conditions for barber pole worm larvae. She was treated for barber pole worm on March 28th and has not fully recovered.","severity":"high","alertKey":"barber_pole_mae_t105"}]`;

    console.log(`[weather-alerts] Calling Claude for ranch ${ranchId} (${location}) — ${animals.length} animals, ${profileLines.length} with health history`);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      console.error(`[weather-alerts] Unexpected response type from Claude: ${content.type}`);
      return 0;
    }

    console.log(`[weather-alerts] Ranch ${ranchId}: Claude raw response (${content.text.length} chars):\n${content.text}`);

    let parsedAlerts: Array<{
      alertType: string;
      summary?: string | null;
      message: string;
      severity: string;
      alertKey: string;
    }>;

    try {
      // Strip code fence lines (lines that are only ```json or ```) so the regex finds the array
      const rawText = content.text
        .split("\n")
        .filter(line => !/^`{3}(?:json|js|javascript)?\s*$/.test(line.trim()))
        .join("\n");

      // Extract the JSON array — handle truncated responses by recovering partial JSON
      let jsonStr = rawText.match(/\[[\s\S]*\]/)?.[0] ?? null;
      if (!jsonStr && rawText.trimStart().startsWith("[")) {
        // Response was truncated before closing ]. Recover completed objects up to the last '}'
        const lastBrace = rawText.lastIndexOf("}");
        if (lastBrace > 0) {
          jsonStr = rawText.slice(rawText.indexOf("["), lastBrace + 1) + "]";
          console.warn("[weather-alerts] Response was truncated — recovering partial JSON");
        }
      }
      if (!jsonStr) {
        console.error("[weather-alerts] No JSON array found in Claude response:", content.text.slice(0, 300));
        return 0;
      }
      parsedAlerts = JSON.parse(jsonStr);
      console.log(`[weather-alerts] Parsed ${parsedAlerts.length} alert(s) from Claude`);
    } catch (parseErr) {
      console.error("[weather-alerts] JSON parse failed:", parseErr, "Raw:", content.text.slice(0, 300));
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
        summary: alert.summary ?? null,
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

  // Attach animal name, tag number, and species
  let result = await Promise.all(
    alerts.map(async alert => {
      let animalName: string | null = null;
      let animalTagNumber: string | null = null;
      let animalSpecies: string | null = null;
      if (alert.animalId) {
        const [animal] = await db
          .select({ name: animalsTable.name, tagNumber: animalsTable.tagNumber, species: animalsTable.species })
          .from(animalsTable)
          .where(eq(animalsTable.id, alert.animalId))
          .limit(1);
        animalName = animal?.name ?? null;
        animalTagNumber = animal?.tagNumber ?? null;
        animalSpecies = animal?.species ?? null;
      }
      return { ...alert, animalName, animalTagNumber, animalSpecies };
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

  // Sort by severity: critical -> high -> moderate/medium -> low
  const severityOrder: Record<string, number> = { critical: 0, high: 1, moderate: 2, medium: 2, low: 3 };
  result.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

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

export { generateRecordAlerts, generateWeatherAlerts, upsertAlert, makeKey };
export default router;
