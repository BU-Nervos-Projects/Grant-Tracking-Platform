import { config } from "@/configs/config"
import fetch from "node-fetch"


async function run() {
  const res = await fetch(`${config.backendUrl}/api/cron/risk-scan`, {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      Authorization: `Bearer ${config.serviceBotToken}`,
    },
  })
  const text = await res.text()
  if (!res.ok) {
    console.error("Risk scan failed:", res.status, text)
    process.exit(1)
  }
  console.log("Risk scan ok:", text)
}

run()
