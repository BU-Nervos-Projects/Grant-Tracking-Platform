import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOverdue(isoString: string): string {
  const date = new Date(isoString)
  return `Overdue since ${date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`
}

export function calculateProgress(completedMilestones: number, totalMilestones: number): number {
  if (totalMilestones === 0) return 0
  return Math.round((completedMilestones / totalMilestones) * 100)
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : Number(amount)
  if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
    return "0 CKB"
  }
  return `${Math.floor(numAmount).toLocaleString("en-US")} CKB`
}

export function formatCompactCurrency(amount: number | string | null | undefined): string {
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : Number(amount)
  if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
    return "0 CKB"
  }
  if (numAmount >= 1_000_000_000) return `${(numAmount / 1_000_000_000).toFixed(1)}B CKB`
  if (numAmount >= 1_000_000) return `${(numAmount / 1_000_000).toFixed(1)}M CKB`
  if (numAmount >= 1_000) return `${(numAmount / 1_000).toFixed(0)}K CKB`
  return `${numAmount.toFixed(0)} CKB`
}

/**
 * Nicely format a status into Title Case, handling hyphens/underscores/spaces.
 * e.g. "not-started" -> "Not Started"
 */
export function capitalizeStatus(status: string): string {
  if (!status) return ""
  return status
    .toString()
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Map a status to Tailwind color classes.
 * Accepts variants like "not-started" or "not started".
 */
export function getStatusColor(status: string): string {
  const s = (status || "").toLowerCase().replace(/[_-]+/g, " ").trim()
  switch (s) {
    case "active":
      return "bg-green-900 text-green-100"
    case "completed":
    case "complete":
      return "bg-blue-900 text-blue-100"
    case "planning":
      return "bg-yellow-900 text-yellow-100"
    case "review":
      return "bg-purple-900 text-purple-100"
    case "overdue":
      return "bg-orange-900 text-orange-100"
    case "pending":
      return "bg-gray-900 text-gray-100"
    case "not started":
      return "bg-orange-900 text-orange-100"

    // ✅ NEW: At Risk
    case "at risk":
      return "bg-red-900 text-red-100"

    default:
      return "bg-gray-900 text-gray-100"
  }
}


function normStatus(s?: string) {
  if (!s) return ""
  return s
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
}

export function sortProjects(projects: any[], sortOrder: string) {
  let filteredProjects = [...projects]

  if (sortOrder === "overdue") {
    filteredProjects = filteredProjects.filter((project) => {
      const hasOverdueStatus =
        normStatus(project.status) === "overdue" || normStatus(project.active_milestone_status) === "overdue"

      let isPastEndDate = false
      if (project.end_date) {
        const endDate = new Date(project.end_date)
        const now = new Date()
        isPastEndDate = endDate < now
      }

      return hasOverdueStatus || isPastEndDate
    })
  } else if (sortOrder === "at-risk") {
    filteredProjects = filteredProjects.filter((project) => {
      const progress = project.progress_percentage || 0
      const status = normStatus(project.status)
      return progress < 30 || status === "planning" || status === "review"
    })
  } else if (sortOrder === "not-started") {
    filteredProjects = filteredProjects.filter((project) => {
      const s1 = normStatus(project.status)
      const s2 = normStatus(project.active_milestone_status)
      return s1 === "not-started" || s2 === "not-started"
    })
  }

  return filteredProjects.sort((a, b) => {
    if (sortOrder === "new" || sortOrder === "overdue" || sortOrder === "at-risk" || sortOrder === "not-started") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
  })
}

export function paginateItems<T>(items: T[], currentPage: number, itemsPerPage: number) {
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)

  return {
    currentItems,
    totalPages,
    startIndex,
    endIndex,
  }
}

export function getTimeLeft(endDate: string): string {
  if (!endDate) return "TBD"
  const end = new Date(endDate)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "Overdue"
  if (diffDays === 0) return "Due today"
  if (diffDays === 1) return "1 day"
  if (diffDays < 30) return `${diffDays} days`

  const diffMonths = Math.ceil(diffDays / 30)
  return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`
}

export function formatDate(dateString: string): string {
  if (!dateString) return "TBD"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function getOverdueMessage(dueDate: string): string | null {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = now.getTime() - due.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return null
  return `⚠️ Overdue since ${formatDate(dueDate)} (${diffDays} day${diffDays > 1 ? "s" : ""})`
}

/**
 * Show progress bar for everything except: complete/completed/not started
 * Accept hyphen/space variants of "not started".
 */
export function shouldShowProgressBar(status: string): boolean {
  const normalized = (status || "").toLowerCase().replace(/[_-]+/g, " ").trim()
  return normalized !== "complete" && normalized !== "completed" && normalized !== "not started"
}

export function parseDurationToEndDate(startDate: string | Date, duration: string): Date | null {
  if (!startDate || !duration) return null

  const start = new Date(startDate)
  if (isNaN(start.getTime())) return null

  const durationLower = duration.toLowerCase().trim()
  const match = durationLower.match(/^(\d+)\s*(year|years|month|months|week|weeks|day|days)s?$/i)
  if (!match) return null

  const amount = Number.parseInt(match[1] ?? "")
  const unit = match[2] ? match[2].toLowerCase() : ""

  const endDate = new Date(start)
  switch (unit) {
    case "year":
    case "years":
      endDate.setFullYear(endDate.getFullYear() + amount)
      break
    case "month":
    case "months":
      endDate.setMonth(endDate.getMonth() + amount)
      break
    case "week":
    case "weeks":
      endDate.setDate(endDate.getDate() + amount * 7)
      break
    case "day":
    case "days":
      endDate.setDate(endDate.getDate() + amount)
      break
    default:
      return null
  }
  return endDate
}

export async function getNextMilestoneOrdinal(sql: any, projectId: number): Promise<number> {
  const [{ max_ordinal }] = await sql`
    SELECT COALESCE(MAX(ordinal), 0) as max_ordinal 
    FROM milestones 
    WHERE project_id = ${projectId}
  `
  return (max_ordinal || 0) + 1
}
