import { Router, type IRouter } from "express";
import { db, ranchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/weather", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

  if (!OPENWEATHERMAP_API_KEY) {
    res.status(500).json({ error: true, message: "Weather API key not configured" });
    return;
  }

  const [ranch] = await db
    .select()
    .from(ranchesTable)
    .where(eq(ranchesTable.id, ranchId))
    .limit(1);

  if (!ranch || ranch.lat == null || ranch.lon == null) {
    res.status(400).json({ error: true, message: "Ranch location (lat/lon) not configured. Update your ranch profile first." });
    return;
  }

  const { lat, lon } = ranch;

  try {
    const [currentResp, forecastResp] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=imperial`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=imperial&cnt=40`),
    ]);

    if (!currentResp.ok || !forecastResp.ok) {
      res.status(502).json({ error: true, message: "Failed to fetch weather data" });
      return;
    }

    const currentData = (await currentResp.json()) as {
      main: { temp: number; feels_like: number; humidity: number };
      weather: Array<{ description: string; icon: string }>;
      wind: { speed: number };
    };

    const forecastData = (await forecastResp.json()) as {
      list: Array<{
        main: { temp: number; humidity: number };
        weather: Array<{ description: string; icon: string }>;
        wind: { speed: number };
        rain?: { "3h": number };
        dt_txt: string;
      }>;
    };

    const current = {
      temp: currentData.main.temp,
      feelsLike: currentData.main.feels_like,
      humidity: currentData.main.humidity,
      windSpeed: currentData.wind.speed,
      description: currentData.weather[0]?.description ?? "",
      icon: currentData.weather[0]?.icon ?? "",
    };

    // Aggregate forecast into daily buckets
    const days: Record<string, {
      temps: number[];
      humidity: number[];
      wind: number[];
      rain: number;
      icons: string[];
      descs: string[];
    }> = {};

    for (const entry of forecastData.list) {
      const date = entry.dt_txt.split(" ")[0];
      if (!days[date]) days[date] = { temps: [], humidity: [], wind: [], rain: 0, icons: [], descs: [] };
      days[date].temps.push(entry.main.temp);
      days[date].humidity.push(entry.main.humidity);
      days[date].wind.push(entry.wind.speed);
      days[date].rain += entry.rain?.["3h"] ?? 0;
      days[date].icons.push(entry.weather[0]?.icon ?? "");
      days[date].descs.push(entry.weather[0]?.description ?? "");
    }

    const forecast = Object.entries(days).slice(0, 5).map(([date, d]) => ({
      date,
      tempHigh: Math.max(...d.temps),
      tempLow: Math.min(...d.temps),
      humidity: Math.round(d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length),
      windSpeed: Math.max(...d.wind),
      rainfall: d.rain,
      description: d.descs[0] ?? "",
      icon: d.icons[Math.floor(d.icons.length / 2)] ?? "",
    }));

    res.json({ current, forecast });
  } catch (err) {
    console.error("Weather fetch error:", err);
    res.status(502).json({ error: true, message: "Weather service unavailable" });
  }
});

export default router;
