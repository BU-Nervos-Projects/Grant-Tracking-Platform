// scripts/db.ts
import "dotenv/config"
import { neon, neonConfig } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment")
}

neonConfig.fetchConnectionCache = true

export const sql = neon(databaseUrl, {
  fetchOptions: {
    cache: "no-store",
  },
})
