// scripts/delete-all-projects.ts
//
// One-time nuclear cleanup:
// - Delete ALL rows from projects, milestones, activity_logs
// - Reset the ID sequences back to 1
//
// Run with:
//   npx ts-node scripts/delete-all-projects.ts
//
// ⚠️ WARNING: This deletes EVERYTHING in these tables. Use only on the env you intend.

import "dotenv/config"
import { sql } from "./db"

async function main() {
  console.log("🚨 Starting FULL cleanup: projects + milestones + activity_logs")

  // 1) Show counts before delete
  const [logsBefore] = await sql/*sql*/`
    SELECT COUNT(*)::int AS count FROM activity_logs
  `
  const [milestonesBefore] = await sql/*sql*/`
    SELECT COUNT(*)::int AS count FROM milestones
  `
  const [projectsBefore] = await sql/*sql*/`
    SELECT COUNT(*)::int AS count FROM projects
  `

  console.log("Before delete:")
  console.log("  activity_logs:", logsBefore?.count ?? 0)
  console.log("  milestones   :", milestonesBefore?.count ?? 0)
  console.log("  projects     :", projectsBefore?.count ?? 0)

  // 2) Delete in safe order (children first, then parent)
  console.log("Deleting activity_logs…")
  await sql/*sql*/`
    DELETE FROM activity_logs
  `

  console.log("Deleting milestones…")
  await sql/*sql*/`
    DELETE FROM milestones
  `

  console.log("Deleting projects…")
  await sql/*sql*/`
    DELETE FROM projects
  `

  // 3) Reset sequences (adjust names if your DB uses different ones)
  // These match your earlier SQL: projects_id_seq, milestones_id_seq, activity_logs_id_seq
  console.log("Resetting sequences…")
  await sql/*sql*/`
    ALTER SEQUENCE IF EXISTS activity_logs_id_seq RESTART WITH 1
  `
  await sql/*sql*/`
    ALTER SEQUENCE IF EXISTS milestones_id_seq RESTART WITH 1
  `
  await sql/*sql*/`
    ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 1
  `

  // 4) Show counts after delete
  const [logsAfter] = await sql/*sql*/`
    SELECT COUNT(*)::int AS count FROM activity_logs
  `
  const [milestonesAfter] = await sql/*sql*/`
    SELECT COUNT(*)::int AS count FROM milestones
  `
  const [projectsAfter] = await sql/*sql*/`
    SELECT COUNT(*)::int AS count FROM projects
  `

  console.log("After delete:")
  console.log("  activity_logs:", logsAfter?.count ?? 0)
  console.log("  milestones   :", milestonesAfter?.count ?? 0)
  console.log("  projects     :", projectsAfter?.count ?? 0)

  // If the sql client ever exposes .end(), close it
  // @ts-ignore
  if (typeof sql.end === "function") {
    // @ts-ignore
    await sql.end()
  }

  console.log("✅ Full cleanup complete.")
}

main().catch((err) => {
  console.error("❌ Cleanup script failed:", err)
  process.exitCode = 1
})
