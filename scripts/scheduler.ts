import { config } from "@/configs/config";
import cron from "node-cron";


if (!config.serviceBotToken) {
    console.error("[scheduler] Missing SERVICE_BOT_TOKEN");
    process.exit(1);
}

async function runRiskScan() {
    const url = `${config.backendUrl}/api/cron/risk-scan`;
    try {
        console.log(`[scheduler] Risk-scan ➜ POST ${url} @ ${new Date().toISOString()}`);
        const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${config.serviceBotToken}` },
        });
        const text = await res.text();
        console.log(`[scheduler] Status: ${res.status}`);
        console.log(`[scheduler] Body: ${text}`);
    } catch (e: any) {
        console.error("[scheduler] Error:", e?.message || e);
    }
}

runRiskScan();

// Schedules **02:00 every day** server time.
cron.schedule("0 2 * * *", runRiskScan, { timezone: "UTC" }); // change timezone if needed
console.log("[scheduler] Cron set: 0 2 * * * (every day at 2am, UTC). Press Ctrl+C to stop.");
