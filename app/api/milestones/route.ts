import type { NextRequest } from "next/server"
import { sql } from "@/lib/db"
import type { Milestone } from "@/lib/db"
import {
  handleApiError,
  validateRequired,
  validateNumber,
  validateStringLength,
  validateDate,
  successResponse,
} from "@/lib/api-helpers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("project_id")

    let milestones: Milestone[]

    if (projectId) {
      const validProjectId = validateNumber(projectId, "project_id", { min: 1 })

      milestones = (await sql`
        SELECT * FROM milestones 
        WHERE project_id = ${validProjectId}
        ORDER BY ordinal ASC, created_at ASC
      `) as Milestone[]
    } else {
      milestones = (await sql`
        SELECT * FROM milestones 
        ORDER BY ordinal ASC, created_at ASC
      `) as Milestone[]
    }

    return successResponse(milestones)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project_id, title, description, due_date, status, budget, ordinal } = body

    validateRequired({ project_id, title, due_date })
    validateNumber(project_id, "project_id", { min: 1 })
    validateStringLength(title, "title", 255)
    validateStringLength(description, "description", 5000)
    validateDate(due_date, "due_date")

    if (budget !== null && budget !== undefined) {
      validateNumber(budget, "budget", { min: 0 })
    }

    const finalOrdinal =
      ordinal ||
    (
      (
        await sql`
          SELECT COALESCE(MAX(ordinal), 0) + 1 as next_ordinal 
          FROM milestones 
          WHERE project_id = ${project_id}
        `
      )[0]?.next_ordinal ?? 1
    )

    const [milestone] = (await sql`
      INSERT INTO milestones (project_id, title, description, due_date, status, budget, ordinal)
      VALUES (
        ${project_id}, 
        ${title}, 
        ${description}, 
        ${due_date}, 
        ${status || "pending"}, 
        ${budget}, 
        ${finalOrdinal}
      )
      RETURNING *
    `) as Milestone[]

    return successResponse(milestone, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
