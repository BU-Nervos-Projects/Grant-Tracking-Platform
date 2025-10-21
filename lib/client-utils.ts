// This file contains utilities that are safe to use in client components
import type { Milestone, Project } from "@/lib/types"

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`
  }
  return `$${amount.toFixed(0)}`
}

export function filterProjects(projects: Project[], searchTerm: string): Project[] {
  if (!searchTerm || searchTerm.trim() === "") {
    return projects
  }

  const term = searchTerm.toLowerCase().trim()

  return projects.filter((project) => {
    const name = project.name?.toLowerCase() || ""
    const description = project.description?.toLowerCase() || ""
    const category = project.category?.toLowerCase() || ""

    return name.includes(term) || description.includes(term) || category.includes(term)
  })
}

export function toNumberSafe(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val === "bigint") return Number(val);
  if (typeof val === "string") {
    // strip currency symbols/commas/spaces
    const n = Number(val.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  // Prisma.Decimal or similar
  // decimal.js has toNumber / toString
  const anyVal = val as any;
  if (anyVal?.toNumber && typeof anyVal.toNumber === "function") {
    const n = anyVal.toNumber();
    return Number.isFinite(n) ? n : 0;
  }
  if (anyVal?.toString && typeof anyVal.toString === "function") {
    const n = Number(anyVal.toString());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}


export function sortProjects(projects: Project[], sortOrder: string): Project[] {
  const sorted = [...projects]
  switch (sortOrder) {
    case "oldest":
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    case "overdue":
      return sorted.sort((a, b) => {
        const aOverdue = new Date(a.end_date) < new Date()
        const bOverdue = new Date(b.end_date) < new Date()
        return bOverdue ? 1 : aOverdue ? -1 : 0
      })
    case "at-risk":
      return sorted.sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0))
    default:
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
}

export function paginateItems<T>(items: T[], currentPage: number, itemsPerPage: number) {
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)

  return { currentItems, totalPages, startIndex, endIndex }
}

function norm(s?: string | null): string {
  return (s || "").trim().toLowerCase().replace(/[_\s]+/g, "-")
}

function isOverdueMilestone(m: Milestone): boolean {
  if (!m.due_date) return false
  const due = new Date(m.due_date).getTime()
  const now = Date.now()
  const status = norm(m.status)
  // overdue if past due and not completed
  return due < now && status !== "completed"
}

/** Define "at risk":
 * - has a milestone due within 7 days AND
 * - that milestone is not completed and progress < 50 (or undefined)
 */
function isAtRisk(projectId: number, all: Milestone[]): boolean {
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  const now = Date.now()

  return all.some((m) => {
    if (m.project_id !== projectId || !m.due_date) return false
    const due = new Date(m.due_date).getTime()
    const status = norm(m.status)
    const progress = typeof m.progress === "number" ? m.progress : 0
    const dueSoon = due >= now && due <= now + oneWeek
    return dueSoon && status !== "completed" && progress < 50
  })
}

/** Choose the "current milestone" status for filtering buckets */
function currentMilestoneStatus(projectId: number, all: Milestone[]): string {
  const list = all
    .filter((m) => m.project_id === projectId)
    .sort((a, b) => (a.ordinal ?? a.id) - (b.ordinal ?? b.id))
  if (list.length === 0) return "pending"
  const current = list.find((m) => norm(m.status) !== "completed")
  return current ? norm(current.status) : "completed"
}

/** Your new, clear behavior:
 * - "new"        -> sort by created_at DESC
 * - "oldest"     -> sort by created_at ASC
 * - "overdue"    -> FILTER only projects that HAVE any overdue milestone (order: newest first)
 * - "at-risk"    -> FILTER only projects that match isAtRisk (order: nearest end_date first)
 * - "not-started"-> FILTER only projects whose current milestone status is "not-started"/"pending"
 *                   (order: created_at DESC)
 */
export function filterAndSortProjects(
  projects: Project[],
  milestones: Milestone[],
  sortOrder: string
): Project[] {
  const sortedCopy = [...projects]

  switch (sortOrder) {
    case "oldest":
      return sortedCopy.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

    case "overdue": {
      const only = sortedCopy.filter((p) =>
        milestones.some((m) => m.project_id === p.id && isOverdueMilestone(m))
      )
      return only.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    case "at-risk": {
      const only = sortedCopy.filter((p) => isAtRisk(p.id, milestones))
      // Optional ordering: earlier end_date first, then created_at
      return only.sort((a, b) => {
        const ae = a.end_date ? new Date(a.end_date).getTime() : Number.POSITIVE_INFINITY
        const be = b.end_date ? new Date(b.end_date).getTime() : Number.POSITIVE_INFINITY
        if (ae !== be) return ae - be
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    }

    case "completed": {
      const only = sortedCopy.filter((p) => {
        const statusFromMilestones = currentMilestoneStatus(p.id, milestones)
        if (statusFromMilestones !== "pending") {
          return statusFromMilestones === "completed" // has milestones, all done
        }
        // no milestones → fall back to project.status
        return norm(p.status) === "completed"
      })
      // Optional: most recently updated first
      return only.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    }

    // "new" (default)
    default:
      return sortedCopy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
  }
}
