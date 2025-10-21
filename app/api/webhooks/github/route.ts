import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { GitHubWebhookPayload } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const payload: GitHubWebhookPayload = await request.json()
    const event = request.headers.get("x-github-event")

    let activityData = null

    // Handle different GitHub events
    switch (event) {
      case "push":
        if (payload.commits && payload.commits.length > 0) {
          const commit = payload.commits[0] // Use the first commit
          activityData = {
            project_id: 1, // Placeholder - map repo to project later
            source: "github",
            type: "commit",
            content: commit?.message,
            url: commit?.url,
            timestamp: new Date(payload.head_commit?.timestamp || Date.now()),
          }
        }
        break

      case "pull_request":
        if (payload.action === "opened" || payload.action === "closed") {
          activityData = {
            project_id: 1, // Placeholder - map repo to project later
            source: "github",
            type: "pull_request",
            content: `${payload.action === "opened" ? "Opened" : "Closed"} PR: ${payload.pull_request?.title}`,
            url: payload.pull_request?.html_url,
            timestamp: new Date(payload.pull_request?.created_at || Date.now()),
          }
        }
        break

      case "issues":
        if (payload.action === "opened" || payload.action === "closed") {
          activityData = {
            project_id: 1, // Placeholder - map repo to project later
            source: "github",
            type: "issue",
            content: `${payload.action === "opened" ? "Opened" : "Closed"} issue: ${payload.issue?.title}`,
            url: payload.issue?.html_url,
            timestamp: new Date(payload.issue?.created_at || Date.now()),
          }
        }
        break
    }

    // Insert activity log if we have data
    if (activityData) {
      await sql`
        INSERT INTO activity_logs (project_id, source, type, content, url, timestamp)
        VALUES (${activityData.project_id}, ${activityData.source}, ${activityData.type}, 
                ${activityData.content}, ${activityData.url}, ${activityData.timestamp})
      `
    }

    return NextResponse.json({ success: true, event, processed: !!activityData })
  } catch (error) {
    console.error("GitHub webhook error:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
