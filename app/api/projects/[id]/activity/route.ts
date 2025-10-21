// app/api/projects/[id]/activity/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

function asInt(v: string | null, def = 50) {
  const n = v ? Number.parseInt(v) : def
  return Number.isFinite(n) && n > 0 ? n : def
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = Number.parseInt(params.id)
    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 })
    }

    const url = new URL(req.url)
    const limit = asInt(url.searchParams.get("limit"), 50)

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
      WHERE al.project_id = ${projectId}
      ORDER BY al.timestamp DESC
      LIMIT ${limit}
    `

    // Normalize for UI (safe link fallback to project page)
    const data = rows.map((r: any) => ({
      id: r.id,
      project_id: r.project_id,
      project: r.project_name,
      type: r.activity_type,        // e.g. 'progress_update', 'milestone_completed'
      source: r.source,             // 'discord' | 'github' | 'manual'
      title: r.title,
      description: r.description,
      author: r.author,
      timestamp: r.timestamp,
      link:
        r.url && typeof r.url === "string" && r.url.trim()
          ? r.url
          : `/individual-project?id=${r.project_id}`,
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching project activity:", error)
    return NextResponse.json({ error: "Failed to fetch project activity" }, { status: 500 })
  }
}

// POST /api/projects/:id/activity
// Body: { title: string, description?: string, author?: string, source?: 'discord'|'manual'|'github' }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = Number.parseInt(params.id)
    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 })
    }

    const { title, description = "", author = null, source = "manual" } = await req.json()

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Ensure project exists
    const [p] = await sql/*sql*/`SELECT id FROM projects WHERE id = ${projectId}`
    if (!p) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    const [row] = await sql/*sql*/`
      INSERT INTO activity_logs
        (project_id, activity_type, source, title, description, url, author, metadata)
      VALUES
        (${projectId}, 'progress_update', ${source}, ${title}, ${description}, NULL, ${author}, '{}')
      RETURNING id, project_id, activity_type, source, title, description, url, author, timestamp
    `

    // touch project's last_activity_at
    await sql/*sql*/`
      UPDATE projects
      SET last_activity_at = now(), updated_at = now()
      WHERE id = ${projectId}
    `

    if (!row) {
      return NextResponse.json({ error: "Failed to create activity log entry" }, { status: 500 })
    }

    return NextResponse.json({
      id: row.id,
      project_id: row.project_id,
      type: row.activity_type,
      source: row.source,
      title: row.title,
      description: row.description,
      author: row.author,
      timestamp: row.timestamp,
      link: `/individual-project?id=${row.project_id}`,
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating project activity:", error)
    return NextResponse.json({ error: "Failed to create project activity" }, { status: 500 })
  }
}
