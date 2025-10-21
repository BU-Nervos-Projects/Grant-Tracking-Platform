import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = Number(url.searchParams.get("limit") || 50)
    const projectIdParam = url.searchParams.get("project_id")
    const projectId = projectIdParam ? Number(projectIdParam) : null

    const rows = await sql/*sql*/`
      SELECT
        al.id,
        al.project_id,
        p.name AS project_name,
        al.activity_type,
        al.source,
        al.title,
        al.description,
        al.url,
        al.author,
        al.timestamp
      FROM activity_logs al
      JOIN projects p ON p.id = al.project_id
      ${projectId ? sql`WHERE al.project_id = ${projectId}` : sql``}
      ORDER BY al.timestamp DESC
      LIMIT ${limit}
    `

    const data = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      project_id: r.project_id,
      timestamp: r.timestamp,       // ISO string; format on the client if you like
      type: r.activity_type,        // 'progress_update', 'milestone_completed', etc.
      project: r.project_name,
      // ✅ ALWAYS return a string for link
      link: r.url && typeof r.url === "string" && r.url.trim() !== ""
        ? r.url
        : `/individual-project?id=${r.project_id}`,
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching recent updates:", error)
    return NextResponse.json({ error: "Failed to fetch recent updates" }, { status: 500 })
  }
}
