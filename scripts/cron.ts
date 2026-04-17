// This file sets up a cron job that runs daily at 9 AM to send WhatsApp alerts
// Import this in a custom server or run as a separate process

import cron from "node-cron";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const SECRET = process.env.NEXTAUTH_SECRET!;

// Runs every day at 9:00 AM
cron.schedule("0 9 * * *", async () => {
  console.log("[CRON] Running daily WhatsApp alert job...");
  try {
    const res = await fetch(`${BASE_URL}/api/alerts`, {
      method: "POST",
      headers: { "x-cron-secret": SECRET },
    });
    const data = await res.json();
    console.log(`[CRON] Alerts sent: ${data.sent}, checked: ${data.checked}`);
  } catch (err) {
    console.error("[CRON] Alert job failed:", err);
  }
});

console.log("[CRON] Scheduler started — alerts run daily at 9:00 AM");
