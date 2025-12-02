import { validateEnvironmentVariables } from "@/lib/api-helpers"
import "dotenv/config"

const requiredVars = [
  "DATABASE_URL",
  "SERVICE_BOT_TOKEN",
  "GITHUB_TOKEN",
  "DISCORD_BOT_TOKEN_COMMANDER",
  "DISCORD_GUILD_ID",
  "DISCORD_APP_ID_COMMANDER",
]

validateEnvironmentVariables(requiredVars)

export const config = {
  backendUrl: process.env.BACKEND_URL!,
  serviceBotToken: process.env.SERVICE_BOT_TOKEN!,
  githubToken: process.env.GITHUB_TOKEN!,
  discordBotToken: process.env.DISCORD_BOT_TOKEN_COMMANDER!,
  guildId: process.env.DISCORD_GUILD_ID!,
  databaseUrl: process.env.DATABASE_URL!,
  discordAppId: process.env.DISCORD_APP_ID_COMMANDER!,
  discordPublicKey: process.env.DISCORD_PUBLIC_KEY!
}
