import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { config } from "@/configs/config"


export async function POST(req: Request) {
  try {
    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 })

    const [p] = await sql/*sql*/`
      SELECT id, creator_username, assignee_discord_id
      FROM projects
      WHERE id=${projectId}
      LIMIT 1
    `
    if (!p) return NextResponse.json({ error: "Project not found" }, { status: 404 })
    if (!p.creator_username) return NextResponse.json({ error: "creator_username not set on project" }, { status: 400 })
    if (p.assignee_discord_id) return NextResponse.json({ ok: true, message: "Already resolved", assignee_discord_id: p.assignee_discord_id })

    const q = encodeURIComponent(p.creator_username)
    const res = await fetch(`https://discord.com/api/v10/guilds/${config.guildId}/members/search?query=${q}&limit=5`, {
      headers: { Authorization: `Bot ${config.discordBotToken}` },
      cache: "no-store",
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: "Discord search failed", details: text }, { status: 502 })
    }
    const members = await res.json() as Array<{ user: { id: string, username?: string, global_name?: string }, nick?: string }>
    const lc = p.creator_username.toLowerCase()
    const match = members.find(m =>
      m.user?.username?.toLowerCase() === lc ||
      m.user?.global_name?.toLowerCase() === lc ||
      m.nick?.toLowerCase() === lc
    ) || members[0]

    if (!match) {
      return NextResponse.json({ ok: false, message: "No member matched. Ask the assignee to run /claim <project_id> in Discord." }, { status: 404 })
    }

    await sql/*sql*/`
      UPDATE projects
      SET assignee_discord_id=${match.user.id}, updated_at=now()
      WHERE id=${projectId}
    `
    return NextResponse.json({ ok: true, assignee_discord_id: match.user.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
