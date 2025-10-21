import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const discordId = searchParams.get("discord_id");
    if (!discordId) return NextResponse.json({ error: "discord_id required" }, { status: 400 });

    const rows = await sql/*sql*/`
    SELECT id, name
    FROM projects
    WHERE assignee_discord_id = ${discordId}
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 200
  `;
    // Return minimal payload for Discord (keep it light)
    return NextResponse.json(rows.map((p: any) => ({ id: p.id, name: p.name })));
}
