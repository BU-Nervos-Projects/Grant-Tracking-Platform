// app/api/cron/risk-scan/route.ts
import { NextResponse, NextRequest } from "next/server"
import { sql } from "@/lib/db"
import { config } from "@/configs/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// --- helpers ---
const DAY_MS = 24 * 60 * 60 * 1000
const DAYS_30_MS = 30 * DAY_MS

function isAtLeast30DaysOld(baseDate: Date | null) {
  if (!baseDate || isNaN(baseDate.getTime())) return false
  const age = Date.now() - baseDate.getTime()
  return age >= DAYS_30_MS
}

function normalizeRepo(repo?: string | null): string | null {
  if (!repo) return null
  const r = repo.trim()
  const m = r.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git|\/)?$/i)
  if (m) return `${m[1]}/${m[2]}`
  if (/^[^/\s]+\/[^/\s]+$/.test(r)) return r
  return null
}

async function getDiscordActivityCount(projectId: number, sinceIso: string) {
  const rows = await sql/*sql*/`
    SELECT COUNT(*)::int AS cnt
    FROM activity_logs
    WHERE project_id = ${projectId}
      AND source = 'discord'
      AND "timestamp" >= ${sinceIso}
  `
  return (rows?.[0]?.cnt ?? 0) as number
}

// ---------- GitHub helpers ----------

type GithubCommitSummary = {
  sha: string
  message: string | null
  authorName: string | null
  date: string | null
  url: string | null
}

type GithubPrSummary = {
  number: number
  title: string | null
  state: string
  merged: boolean
  updatedAt: string | null
  mergedAt: string | null
  url: string | null
}

type GithubCheck = {
  ok: boolean
  reason?: string
  commitActivity?: boolean
  pullActivity?: boolean
  lastCommit?: GithubCommitSummary | null
  lastMergedPr?: GithubPrSummary | null
}

async function checkGithubActivity(repo: string, sinceIso: string): Promise<GithubCheck> {
  if (!repo || !repo.includes("/")) return { ok: false, reason: "invalid_repo_format" }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "risk-scan",
  }
  if (config.githubToken) headers.Authorization = `Bearer ${config.githubToken}`

  const base = `https://api.github.com/repos/${repo}`

  try {
    const sinceDate = new Date(sinceIso)

    // latest commit
    const commitsUrl = `${base}/commits?per_page=1`
    const cRes = await fetch(commitsUrl, { headers, cache: "no-store" })
    if (!cRes.ok) {
      const t = await cRes.text().catch(() => "")
      return { ok: false, reason: `commits_check_failed:${cRes.status}:${t}` }
    }
    const commits = (await cRes.json()) as any[]
    let lastCommit: GithubCommitSummary | null = null
    let commitActivity = false

    if (Array.isArray(commits) && commits.length > 0) {
      const c = commits[0]
      const cMsg = c?.commit?.message ?? null
      const cDate: string | null =
        c?.commit?.author?.date ?? c?.commit?.committer?.date ?? null
      const cAuthor: string | null =
        c?.commit?.author?.name ??
        c?.author?.login ??
        c?.commit?.committer?.name ??
        null

      lastCommit = {
        sha: c?.sha ?? "",
        message: cMsg,
        authorName: cAuthor,
        date: cDate,
        url: c?.html_url ?? null,
      }

      if (cDate) {
        const d = new Date(cDate)
        commitActivity = d >= sinceDate
      }
    }

    // latest merged PR
    const prsUrl = `${base}/pulls?state=all&sort=updated&direction=desc&per_page=20`
    const pRes = await fetch(prsUrl, { headers, cache: "no-store" })
    if (!pRes.ok) {
      const t = await pRes.text().catch(() => "")
      return {
        ok: false,
        reason: `prs_check_failed:${pRes.status}:${t}`,
        commitActivity,
        lastCommit,
      }
    }
    const pulls = (await pRes.json()) as any[]
    let lastMergedPr: GithubPrSummary | null = null
    let pullActivity = false

    if (Array.isArray(pulls) && pulls.length > 0) {
      const mergedPr = pulls.find((pr) => !!pr?.merged_at) ?? null
      if (mergedPr) {
        const mergedAt: string | null = mergedPr.merged_at ?? null
        const updatedAt: string | null = mergedPr.updated_at ?? null

        lastMergedPr = {
          number: mergedPr.number,
          title: mergedPr.title ?? null,
          state: mergedPr.state ?? "closed",
          merged: !!mergedPr.merged_at,
          updatedAt,
          mergedAt,
          url: mergedPr.html_url ?? null,
        }

        const compareDateStr = mergedAt ?? updatedAt
        if (compareDateStr) {
          const d = new Date(compareDateStr)
          pullActivity = d >= sinceDate
        }
      }
    }

    return {
      ok: true,
      commitActivity,
      pullActivity,
      lastCommit,
      lastMergedPr,
    }
  } catch (e: any) {
    return { ok: false, reason: `github_error:${e?.message || "unknown"}` }
  }
}

// ---------- activity_logs helpers ----------

async function activityExists(
  projectId: number,
  activity_type: string,
  url: string | null
): Promise<boolean> {
  if (!url) return false
  const rows = await sql/*sql*/`
    SELECT 1
    FROM activity_logs
    WHERE project_id = ${projectId}
      AND activity_type = ${activity_type}
      AND url = ${url}
    LIMIT 1
  `
  return rows.length > 0
}

async function insertActivityLog(entry: {
  projectId: number
  activity_type: string
  source: string
  title: string | null
  description: string | null
  url: string | null
  author: string | null
  timestamp: string | null
}) {
  const { projectId, activity_type, source, title, description, url, author, timestamp } = entry

  await sql/*sql*/`
    INSERT INTO activity_logs (project_id, activity_type, source, title, description, url, author, "timestamp")
    VALUES (
      ${projectId},
      ${activity_type},
      ${source},
      ${title},
      ${description},
      ${url},
      ${author},
      ${timestamp ? new Date(timestamp) : new Date()}
    )
  `
}

// --- core job ---

function computeBaseDate(start_date: string | null, created_at: string | null): Date | null {
  const now = Date.now()

  const created = created_at ? new Date(created_at) : null
  const start = start_date ? new Date(start_date) : null

  const isValidPast = (d: Date | null) =>
    !!d && !isNaN(d.getTime()) && d.getTime() <= now

  if (isValidPast(start)) return start
  if (isValidPast(created)) return created
  return null
}

async function runRiskScanJob() {
  // global 30-day window (for Discord, and as a floor for GitHub)
  const globalSince = new Date(Date.now() - DAYS_30_MS)
  const globalSinceIso = globalSince.toISOString()

  // 0) FIRST: mark all overdue milestones as 'overdue'
  await sql/*sql*/`
    UPDATE milestones
    SET status = 'overdue'
    WHERE 
      due_date IS NOT NULL
      AND due_date <= NOW()
      AND status <> 'completed'
      AND status <> 'overdue'
  `

  // 1) Load projects
  const projects = await sql/*sql*/`
    SELECT id, name, status, github_repo, created_at, start_date
    FROM projects
    ORDER BY created_at DESC
  `

  // 2) Preload earliest overdue milestone per project
  const milestonesRows = await sql/*sql*/`
    SELECT 
      m.project_id,
      MIN(m.due_date) AS earliest_overdue_due
    FROM milestones m
    WHERE 
      m.due_date IS NOT NULL
      AND m.status <> 'completed'
      AND m.due_date <= NOW()
    GROUP BY m.project_id
  `

  const milestoneMap = new Map<number, { earliest_overdue_due: string | null }>()

  for (const row of milestonesRows as any[]) {
    milestoneMap.set(row.project_id, {
      earliest_overdue_due: row.earliest_overdue_due,
    })
  }

  const results: Array<{
    projectId: number
    name: string
    base_date: string | null
    age_days: number | null
    repo: string | null
    repo_check: "none" | "checked" | "invalid" | "error"
    github: { commitActivity?: boolean; pullActivity?: boolean; reason?: string }
    discord: { hasActivity: boolean; countKnown?: number }
    final: "active" | "at-risk"
    note: string
    milestone_overdue_days?: number | null
  }> = []

  for (const p of projects as any[]) {
    const baseDate = computeBaseDate(p.start_date, p.created_at)

    if (!baseDate) {
      results.push({
        projectId: p.id,
        name: p.name,
        base_date: null,
        age_days: null,
        repo: normalizeRepo(p.github_repo),
        repo_check: "none",
        github: { reason: "invalid_or_future_start/created_at" },
        discord: { hasActivity: false, countKnown: 0 },
        final: "active",
        note: "Invalid or future start/created date; skipped (status unchanged)",
      })
      continue
    }

    const ageMs = Date.now() - baseDate.getTime()
    const ageDays = Math.max(0, Math.floor(ageMs / DAY_MS))

    // milestone-based overdue age
    const milestoneInfo = milestoneMap.get(p.id) || null
    let milestoneOverdueDays: number | null = null

    if (milestoneInfo?.earliest_overdue_due) {
      const due = new Date(milestoneInfo.earliest_overdue_due)
      if (!isNaN(due.getTime())) {
        milestoneOverdueDays = Math.floor((Date.now() - due.getTime()) / DAY_MS)
      }
    }

    const hasOverdueMilestone =
      milestoneOverdueDays !== null && milestoneOverdueDays >= 0

    const eligibleForRiskScan =
      isAtLeast30DaysOld(baseDate) || hasOverdueMilestone

    // Discord window: last 30 days (global)
    const discordCount = await getDiscordActivityCount(p.id, globalSinceIso)
    const discordHas = discordCount > 0

    // Per-project "since" for GitHub:
    // must be >= project baseDate and within last 30 days
    const sinceForGithub = new Date(
      Math.max(globalSince.getTime(), baseDate.getTime())
    )
    const sinceForGithubIso = sinceForGithub.toISOString()

    const normRepo = normalizeRepo(p.github_repo)
    let repo_check: "none" | "checked" | "invalid" | "error" = "none"
    let gh: { commitActivity?: boolean; pullActivity?: boolean; reason?: string } = {}

    // GitHub logic
    if (normRepo === null && p.github_repo) {
      repo_check = "invalid"
      gh = { reason: "invalid_repo_format" }
    } else if (normRepo) {
      const ghRes = await checkGithubActivity(normRepo, sinceForGithubIso)
      if (!ghRes.ok) {
        repo_check = ghRes.reason?.startsWith("invalid_repo_format") ? "invalid" : "error"
        gh = { reason: ghRes.reason }
      } else {
        repo_check = "checked"
        gh = {
          commitActivity: !!ghRes.commitActivity,
          pullActivity: !!ghRes.pullActivity,
        }

        // activity logs (commit) – only if it's within sinceForGithub window
        if (
          ghRes.lastCommit &&
          ghRes.lastCommit.url &&
          ghRes.commitActivity
        ) {
          const already = await activityExists(p.id, "commit", ghRes.lastCommit.url)
          if (!already) {
            await insertActivityLog({
              projectId: p.id,
              activity_type: "commit",
              source: "GITHUB",
              title: ghRes.lastCommit.message?.split("\n")[0] || "Commit",
              description: ghRes.lastCommit.message,
              url: ghRes.lastCommit.url,
              author: ghRes.lastCommit.authorName,
              timestamp: ghRes.lastCommit.date,
            })
          }
        }

        // activity logs (merged PR) – only if it's within sinceForGithub window
        if (
          ghRes.lastMergedPr &&
          ghRes.lastMergedPr.url &&
          ghRes.pullActivity
        ) {
          const already = await activityExists(p.id, "merge", ghRes.lastMergedPr.url)
          if (!already) {
            await insertActivityLog({
              projectId: p.id,
              activity_type: "merge",
              source: "GITHUB",
              title: ghRes.lastMergedPr.title || `Merged PR #${ghRes.lastMergedPr.number}`,
              description: ghRes.lastMergedPr.merged
                ? `PR #${ghRes.lastMergedPr.number} merged`
                : `PR #${ghRes.lastMergedPr.number} (${ghRes.lastMergedPr.state})`,
              url: ghRes.lastMergedPr.url,
              author: null,
              timestamp: ghRes.lastMergedPr.mergedAt || ghRes.lastMergedPr.updatedAt,
            })
          }
        }
      }
    } else {
      repo_check = "none"
    }

    // If project & milestones are too new, skip risk update
    if (!eligibleForRiskScan) {
      results.push({
        projectId: p.id,
        name: p.name,
        base_date: baseDate.toISOString(),
        age_days: ageDays,
        repo: normRepo,
        repo_check,
        github: gh,
        discord: { hasActivity: discordHas, countKnown: discordCount },
        final: "active",
        note: "Project and milestones < 30 days old (skipped for risk-scan; status unchanged)",
        milestone_overdue_days: milestoneOverdueDays,
      })
      continue
    }

    const noGithubActivity =
      !normRepo ||
      (repo_check === "checked" && !gh.commitActivity && !gh.pullActivity) ||
      repo_check === "invalid" ||
      repo_check === "error"

    let final: "active" | "at-risk" = "active"
    let note = ""

    if (hasOverdueMilestone) {
      final = "at-risk"

      if (!discordHas && noGithubActivity) {
        note = `Overdue milestone (${milestoneOverdueDays} days) and no Discord/GitHub activity in 30d`
      } else {
        note = `Overdue milestone (${milestoneOverdueDays} days)`
      }
    } else {
      final = !discordHas && noGithubActivity ? "at-risk" : "active"

      if (final === "at-risk") {
        if (!normRepo) note = "No Discord updates in 30d and no GitHub repo set"
        else if (repo_check === "invalid")
          note = "No Discord updates in 30d and GitHub repo format is invalid"
        else if (repo_check === "error")
          note = "No Discord updates in 30d and GitHub check errored"
        else note = "No Discord updates in 30d and no GitHub activity in 30d"
      } else {
        note = "Has Discord and/or GitHub activity in 30d"
      }
    }

    // Update project status if needed
    if (final === "at-risk" && p.status !== "at-risk") {
      await sql/*sql*/`
        UPDATE projects
        SET status = 'at-risk'
        WHERE id = ${p.id}
      `
    }

    results.push({
      projectId: p.id,
      name: p.name,
      base_date: baseDate.toISOString(),
      age_days: ageDays,
      repo: normRepo,
      repo_check,
      github: gh,
      discord: { hasActivity: discordHas, countKnown: discordCount },
      final,
      note,
      milestone_overdue_days: milestoneOverdueDays,
    })
  }

  return { since: globalSinceIso, results }
}

// --- POST: manual / scheduler trigger with SERVICE_BOT_TOKEN ---
export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || ""
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : ""
    if (!config.serviceBotToken || token !== config.serviceBotToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const out = await runRiskScanJob()
    return NextResponse.json(out)
  } catch (e: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[risk-scan][POST] error:", e)
    }
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")

    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const out = await runRiskScanJob()
    return NextResponse.json(out)
  } catch (e: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[risk-scan][GET] error:", e)
    }
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    )
  }
}
