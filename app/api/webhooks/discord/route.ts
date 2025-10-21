import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { DiscordWebhookPayload } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const payload: DiscordWebhookPayload = await request.json()

    // Discord webhook payload structure
    const { content, author, channel_id, id, timestamp, guild_id } = payload

    if (!content || !author) {
      return NextResponse.json({ error: "Invalid Discord webhook payload" }, { status: 400 })
    }

    // Create Discord message URL (if guild_id is available)
    const messageUrl =
      guild_id && channel_id && id ? `https://discord.com/channels/${guild_id}/${channel_id}/${id}` : null

    // Insert activity log
    await sql`
      INSERT INTO activity_logs (project_id, source, type, content, url, timestamp)
      VALUES (${1}, ${"discord"}, ${"announcement"}, ${content}, ${messageUrl}, ${new Date(timestamp || Date.now())})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Discord webhook error:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
