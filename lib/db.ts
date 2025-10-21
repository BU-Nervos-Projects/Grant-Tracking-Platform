import "server-only"
import { config } from "@/configs/config"
import { neon, neonConfig } from "@neondatabase/serverless"
import type { Project, Milestone, ActivityLog, GitHubWebhookPayload, DiscordWebhookPayload } from "./types"

neonConfig.fetchConnectionCache = true

const sql = neon(config.databaseUrl, {
  fetchOptions: {
    cache: "no-store",
  },
})

export { sql }
export type { Project, Milestone, ActivityLog, GitHubWebhookPayload, DiscordWebhookPayload }
