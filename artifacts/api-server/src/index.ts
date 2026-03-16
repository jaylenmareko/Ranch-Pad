import app from "./app";
import { checkDbConnectivity, generateAlertsForAllRanches } from "./lib/startup-tasks.js";

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

    // Non-blocking startup alert generation
    generateAlertsForAllRanches()
      .then(() => console.log("Startup alert generation complete"))
      .catch((err: Error) => console.error("Startup alert generation failed:", err.message));
  });
}

start().catch((err: Error) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
