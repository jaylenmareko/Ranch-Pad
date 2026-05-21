import app from "./app";
import { checkDbConnectivity, generateAlertsForAllRanches } from "./lib/startup-tasks.js";
import { runScheduledAlerts } from "./lib/scheduled-alerts.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  await checkDbConnectivity();
  console.log("Database connection verified");

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);

    generateAlertsForAllRanches()
      .then(() => console.log("Startup alert generation complete"))
      .catch((err: Error) => console.error("Startup alert generation failed:", err.message));

    // Full alert generation (record + AI weather) every 6 hours
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    setInterval(() => {
      console.log("[scheduled-alerts] Running scheduled alert generation...");
      runScheduledAlerts()
        .then(() => console.log("[scheduled-alerts] Scheduled run complete"))
        .catch((err: Error) => console.error("[scheduled-alerts] Scheduled run failed:", err.message));
    }, SIX_HOURS_MS);
  });
}

start().catch((err: Error) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
