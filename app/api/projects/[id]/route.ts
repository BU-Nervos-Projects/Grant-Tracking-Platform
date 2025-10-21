import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { Project } from "@/lib/db"
import { parseDurationToEndDate } from "@/lib/utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = Number.parseInt(params.id)

    const [project] = await sql`
      SELECT 
        p.*,
        COUNT(m.id) as total_milestones,
        COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_milestones,
        CASE 
          WHEN COUNT(m.id) = 0 THEN 0
          ELSE ROUND((COUNT(CASE WHEN m.status = 'completed' THEN 1 END)::numeric / COUNT(m.id)::numeric) * 100, 2)
        END as progress_percentage
      FROM projects p
      LEFT JOIN milestones m ON p.id = m.project_id
      WHERE p.id = ${projectId}
      GROUP BY p.id
    `

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = Number.parseInt(params.id)
    const body = await request.json()
    const { name, description, status, github_repo, discord_channel, funding_amount, start_date, end_date, duration } =
      body

    let calculatedEndDate = end_date
    if (!end_date && duration && start_date) {
      const parsedEndDate = parseDurationToEndDate(start_date, duration)
      if (parsedEndDate) {
        calculatedEndDate = parsedEndDate.toISOString().split("T")[0]
      }
    }

    const [project] = (await sql`
      UPDATE projects 
      SET name = ${name}, description = ${description}, status = ${status}, 
          github_repo = ${github_repo}, discord_channel = ${discord_channel}, 
          funding_amount = ${funding_amount}, start_date = ${start_date}, 
          end_date = ${calculatedEndDate}, duration = ${duration}, updated_at = NOW()
      WHERE id = ${projectId}
      RETURNING *
    `) as Project[]

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = Number.parseInt(params.id)

    await sql`DELETE FROM projects WHERE id = ${projectId}`

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
