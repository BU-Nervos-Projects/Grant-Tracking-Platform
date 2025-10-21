import useSWR from "swr"

/** Single project row as returned by /api/export/all (nested=true) */
export interface ProjectExport {
    id: number
    name: string
    description: string | null
    status: string | null
    github_repo: string | null
    discord_channel: string | null
    funding_amount: string | null            // DECIMAL comes back as string
    start_date: string | null                // ISO string or null
    end_date: string | null                  // ISO string or null
    assignee_discord_id: string | null
    last_activity_at: string | null          // ISO or null

    // Extra fields
    creator_username: string | null
    grantee_email: string | null
    category: string | null
    program_type: string | null
    project_background: string | null
    mission_expertise: string | null
    campaign_goals: string | null
    creator_stat_1_name: string | null
    creator_stat_1_number: number | null
    creator_stat_2_name: string | null
    creator_stat_2_number: number | null
    youtube_link: string | null
    tiktok_link: string | null
    twitter_link: string | null
    twitch_link: string | null
    website_links: string | null
    duration: string | null
    proposal_link: string | null
    created_at: string                       // ISO
    updated_at: string                       // ISO

    // Aggregates joined in query (often strings depending on driver)
    total_milestones: string | number | null
    completed_milestones: string | number | null
    progress_percentage: string | number | null

    // Derived/joined field
    active_milestone_status: string | null
}

/** Single milestone row */
export interface MilestoneExport {
    id: number
    project_id: number
    title: string
    description: string | null
    due_date: string | null                  // ISO or null
    status: string                           // e.g. "active" | "completed" | "not started" | ...
    completion_date: string | null           // ISO or null
    budget: string | null                    // DECIMAL -> string
    ordinal: number | null
    created_at: string                       // ISO
    updated_at: string                       // ISO
}

/** Single activity log row */
export interface ActivityLogExport {
    id: number
    project_id: number
    activity_type: string                    // e.g. "milestone_completed"
    source: string                           // e.g. "discord", "github"
    title: string | null
    description: string | null
    url: string | null
    author: string | null
    timestamp: string                        // ISO
    metadata: Record<string, unknown> | null
}

/** The full nested item for one project */
export interface ExportAllNestedItem {
    project: ProjectExport
    milestones: MilestoneExport[]
    activity_logs: ActivityLogExport[]
}

/** The response type from /api/export/all?nested=true */
export type AllDataForProjects = ExportAllNestedItem[]

type IncludeKey = "projects" | "milestones" | "activity_logs"

export interface ExportAllOptions {
    include?: IncludeKey[]                 // default: ["projects","milestones","activity_logs"]
    since?: string | null                  // ISO string, optional
    projectIds?: number[] | null           // whitelist; optional
    projectLimit?: number | null
    milestonesLimit?: number | null
    activityLimit?: number | null
    nested?: boolean                       // default: true
}

const fetcher = async (url: string) => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error(await res.text().catch(() => "Failed to fetch export"))
    return res.json()
}

/**
 * Fetch data from /api/export/all with sensible defaults.
 * Defaults to nested=true and include all 3 collections.
 */
export function useExportAll(opts?: ExportAllOptions): {
    data: AllDataForProjects | undefined
    isLoading: boolean
    error: string | null
    refetch: () => void
} {
    const {
        include = ["projects", "milestones", "activity_logs"],
        since = null,
        projectIds = null,
        projectLimit = null,
        milestonesLimit = null,
        activityLimit = null,
        nested = true,
    } = opts || {}

    const qs = new URLSearchParams()

    // include=projects,milestones,activity_logs
    if (include?.length) qs.set("include", include.join(","))

    // nested=true|false
    qs.set("nested", nested ? "true" : "false")

    // optional filters/limits
    if (since) qs.set("since", since)
    if (projectIds && projectIds.length) qs.set("project_ids", projectIds.join(","))
    if (projectLimit && projectLimit > 0) qs.set("project_limit", String(projectLimit))
    if (milestonesLimit && milestonesLimit > 0) qs.set("milestones_limit", String(milestonesLimit))
    if (activityLimit && activityLimit > 0) qs.set("activity_limit", String(activityLimit))

    const key = `/api/export/all?${qs.toString()}`
    const { data, error, isLoading, mutate } = useSWR<AllDataForProjects>(key, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60_000,
    })

    return {
        data,
        isLoading,
        error: error?.message || null,
        refetch: mutate,
    }
}
