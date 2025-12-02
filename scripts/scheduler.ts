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

// run once on start (optional)
runRiskScan();

// run every 1 minute
cron.schedule("*/1 * * * *", runRiskScan, { timezone: "UTC" });
console.log("[scheduler] Cron set: */1 * * * * (every 1 minutes). Press Ctrl+C to stop.");
