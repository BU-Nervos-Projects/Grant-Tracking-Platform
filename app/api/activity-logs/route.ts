import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { ActivityLog } from "@/lib/db"
import { config } from "@/configs/config"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("project_id")
    const limit = searchParams.get("limit") || "50"

    let activityLogs: ActivityLog[]

    if (projectId) {
      activityLogs = (await sql`
        SELECT * FROM activity_logs 
        WHERE project_id = ${Number.parseInt(projectId)}
        ORDER BY timestamp DESC
        LIMIT ${Number.parseInt(limit)}
      `) as ActivityLog[]
    } else {
      activityLogs = (await sql`
        SELECT * FROM activity_logs 
        ORDER BY timestamp DESC
        LIMIT ${Number.parseInt(limit)}
      `) as ActivityLog[]
    }

    return NextResponse.json(activityLogs)
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[activity-logs][GET] error:", error)
    }
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") || ""
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : ""

    if (!config.serviceBotToken || token !== config.serviceBotToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { project_id, activity_type, source, title, description, url, author, metadata, callerDiscordId } = body

    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 })
    }

    const [p] = await sql /*sql*/`
      SELECT id, assignee_discord_id
      FROM projects
      WHERE id=${project_id}
      LIMIT 1
    `

    if (!p) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const isAdmin = callerDiscordId
    if (!isAdmin) {
      if (!callerDiscordId || callerDiscordId !== p.assignee_discord_id) {
        return NextResponse.json({ error: "Forbidden: project not assigned to you" }, { status: 403 })
      }
    }

    const [activityLog] = (await sql /*sql*/`
      INSERT INTO activity_logs (project_id, activity_type, source, title, description, url, author, metadata)
      VALUES (${project_id}, ${activity_type}, ${source}, ${title}, ${description}, ${url}, ${author}, ${metadata})
      RETURNING *
    `) as ActivityLog[]

    await sql /*sql*/`UPDATE projects SET last_activity_at = NOW(), updated_at = NOW() WHERE id=${project_id}`

    return NextResponse.json(activityLog, { status: 201 })
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[activity-logs][POST] error:", error)
    }
    return NextResponse.json({ error: "Failed to create activity log" }, { status: 500 })
  }
}
