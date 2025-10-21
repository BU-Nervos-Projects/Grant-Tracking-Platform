import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { config } from "@/configs/config"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = Number.parseInt(params.id)

    const milestones = await sql`
      SELECT * FROM milestones 
      WHERE project_id = ${projectId}
      ORDER BY ordinal ASC, created_at ASC
    `

    return NextResponse.json(milestones)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = Number.parseInt(params.id)
    const body = await request.json()
    const { title, description, due_date, status = "planning", budget } = body

    const [milestone] = await sql`
      INSERT INTO milestones (project_id, title, description, due_date, status, budget, ordinal)
      VALUES (
        ${projectId}, 
        ${title}, 
        ${description}, 
        ${due_date}, 
        ${status}, 
        ${budget}, 
        (SELECT COALESCE(MAX(ordinal), 0) + 1 FROM milestones WHERE project_id = ${projectId})
      )
      RETURNING *
    `

    return NextResponse.json(milestone)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 })
  }
}

/**
 * PATCH (Discord)
 * If `milestone_id` omitted, we resolve the "active" milestone:
 * - definition: most recently created non-completed (status != 'completed')
 * Only allow status change to 'completed' via Discord (per your rule).
 * Enforce assignee ownership (or admin via DISCORD_ADMIN_USER_IDS by calling /activity-logs directly if desired).
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = request.headers.get("authorization") || ""
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : ""

    if (!config.serviceBotToken || token !== config.serviceBotToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = Number.parseInt(params.id)
    const body = await request.json()
    const {
      milestone_id,
      status,
      callerDiscordId,
    }: {
      milestone_id?: number
      status: "completed"
      callerDiscordId?: string
    } = body

    // Check assignment first
    const [p] = await sql /*sql*/`SELECT id, assignee_discord_id FROM projects WHERE id=${projectId}`

    if (!p) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    if (!callerDiscordId || callerDiscordId !== p.assignee_discord_id) {
      return NextResponse.json({ error: "Forbidden: project not assigned to you" }, { status: 403 })
    }

    // Only permit 'completed' from Discord
    if (status !== "completed") {
      return NextResponse.json(
        { error: "From Discord you can only mark the active milestone as 'completed'." },
        { status: 400 },
      )
    }

    // Resolve milestone
    let target: any
    if (milestone_id) {
      ;[target] = await sql`SELECT * FROM milestones WHERE id=${milestone_id} AND project_id=${projectId}`
      if (!target) {
        return NextResponse.json({ error: "Milestone not found for this project" }, { status: 404 })
      }
    } else {
      const rows = await sql /*sql*/`
        SELECT * FROM milestones
        WHERE project_id=${projectId} AND status != 'completed'
        ORDER BY created_at DESC
        LIMIT 1
      `
      target = rows[0]
      if (!target) {
        return NextResponse.json({ error: "No active milestone to update" }, { status: 404 })
      }
    }

    const [updated] = await sql`
      UPDATE milestones
      SET status = 'completed',
          completion_date = NOW(),
          updated_at = NOW()
      WHERE id = ${target.id} AND project_id = ${projectId}
      RETURNING *
    `

    await sql /*sql*/`
      INSERT INTO activity_logs(
        project_id, activity_type, source, title, description, url, author, metadata, timestamp
      )
      VALUES(
        ${projectId},
        ${"milestone_completed"},
        ${"discord"},
        ${`Milestone ${target.ordinal ?? ""} "${target.title}" marked completed`},
        ${"Completed via Discord"},
        ${null},
        ${callerDiscordId || null},
        ${JSON.stringify({ milestone_id: target.id, status: "completed", callerDiscordId })},
        NOW()
      )
    `
    await sql /*sql*/`UPDATE projects SET last_activity_at = NOW(), updated_at = NOW() WHERE id = ${projectId}`

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 })
  }
}
