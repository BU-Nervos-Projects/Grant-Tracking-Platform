// app/api/projects/[id]/progress/route.ts
import { NextResponse, type NextRequest } from "next/server"
import { sql } from "@/lib/db"
import { config } from "@/configs/config"

/**
 * POST /api/projects/:id/progress
 * Body: { title: string, description?: string, callerDiscordId?: string }
 * Auth: Bearer SERVICE_BOT_TOKEN
 * Rules:
 *  - Only the assignee (or an admin) can post a recent update.
 *  - Writes a row to activity_logs; does NOT update project name/description.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const auth = req.headers.get("authorization") || ""
        const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : ""
        if (!config.serviceBotToken || token !== config.serviceBotToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const projectId = Number.parseInt(params.id)
        const { title, description = "", callerDiscordId } = await req.json()

        // Fetch project with assignee
        const [p] = await sql/*sql*/`
      SELECT id, name, assignee_discord_id
      FROM projects
      WHERE id = ${projectId}
      LIMIT 1
    `
        if (!p) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        // Permission: assignee or admin
        const isAdmin = callerDiscordId
        if (!isAdmin) {
            if (!callerDiscordId || callerDiscordId !== p.assignee_discord_id) {
                return NextResponse.json({ error: "Forbidden: project not assigned to you" }, { status: 403 })
            }
        }

        // Insert recent update -> activity_logs
        await sql/*sql*/`
      INSERT INTO activity_logs(
        project_id, activity_type, source, title, description, url, author, metadata, timestamp
      ) VALUES (
        ${projectId},
        ${"discord_update"},
        ${"discord"},
        ${title},
        ${description},
        ${null},
        ${callerDiscordId || null},
        ${JSON.stringify({ callerDiscordId, via: "discord-commander" })},
        NOW()
      )
    `

        // Touch last_activity_at only
        await sql/*sql*/`
      UPDATE projects
      SET last_activity_at = NOW(),
          updated_at = NOW()
      WHERE id = ${projectId}
    `

        return NextResponse.json({ ok: true })
    } catch (e: any) {
        console.error("[progress][POST] error:", e)
        return NextResponse.json({ error: "Failed to post progress" }, { status: 500 })
    }
}
