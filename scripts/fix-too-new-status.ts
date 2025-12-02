// scripts/fix-too-new-status.ts
import "dotenv/config"
import { sql } from "./db"

async function main() {
  const rows = await sql/*sql*/`
    UPDATE projects
    SET status = 'active'
    WHERE status = 'too_new'
    RETURNING id, name, status
  `

  console.log(`Updated ${rows.length} projects from 'too_new' -> 'active'`)
  for (const row of rows as any[]) {
    console.log(`- [${row.id}] ${row.name} → ${row.status}`)
  }
}

main().catch((err) => {
  console.error("Error while fixing too_new statuses:", err)
  process.exit(1)
})
