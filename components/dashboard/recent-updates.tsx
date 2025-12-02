// components/dashboard/recent-updates.tsx
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRecentUpdates } from "@/hooks/use-recent-updates"
import { useProjects } from "@/hooks/use-projects"
import { useMemo } from "react"
import { capitalizeStatus } from "@/lib/utils"

function relativeTime(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso // already human or invalid => show as-is
  const diff = Math.max(0, Date.now() - d.getTime())
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

function pickProjectId(u: any): number | null {
  if (typeof u?.project_id === "number") return u.project_id
  if (typeof u?.projectId === "number") return u.projectId
  // sometimes your feed used `id` as project id — keep as last resort
  if (typeof u?.id === "number") return u.id
  return null
}

/** Get a project's category by project id (from projects map) */
function getProjectCategoryById(projectsById: Map<number, any>, projectId: number | null): string | null {
  if (projectId == null) return null
  const p = projectsById.get(projectId)
  if (!p) return null
  const cat = (p as any).category
  return typeof cat === "string" && cat.trim().length ? cat : null
}

export function formatActivityType(s?: string) {
  if (!s) return ""
  const cleaned = s.replace(/_/g, " ")
  return cleaned
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
  // "milestone_completed" -> "Milestone Completed"
  // "discord update"      -> "Discord Update"
}

export function RecentUpdates() {
  const { updates, isLoading, error } = useRecentUpdates()
  const { projects, isLoading: projectsLoading } = useProjects()

  const projectsById = useMemo(() => {
    const m = new Map<number, any>()
    for (const p of projects || []) {
      if (typeof p?.id === "number") m.set(p.id, p)
    }
    return m
  }, [projects])


  if (isLoading) {
    return (
      <div className="w-full lg:w-96 flex-shrink-0">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white" style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}>
            Recent Updates
          </h2>
        </div>
        <div className="space-y-3 md:space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50" style={{ borderRadius: "var(--wui-border-radius-s)" }}>
                <CardContent className="p-3 md:p-4">
                  <div className="h-4 bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-700 rounded mb-3" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-gray-700 rounded" />
                    <div className="h-5 w-12 bg-gray-700 rounded" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full lg:w-96 flex-shrink-0">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white" style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}>
            Recent Updates
          </h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">Failed to load updates</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full lg:w-96 flex-shrink-0">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-white" style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}>
          Recent Updates
        </h2>
      </div>

      <div className="space-y-3 md:space-y-4">
        {updates.slice(0, 10).map((u: any) => {
          // safe link fallback (prevents <Link href={null}> crash)
          const projectId = pickProjectId(u)
          const category = getProjectCategoryById(projectsById, projectId) ?? "General"
          const safeHref = projectId ? `/individual-project?id=${projectId}` : "/"

          const content = (
            <Card
              className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-[#1b7382] transition-colors duration-300 group cursor-pointer"
              style={{ borderRadius: "var(--wui-border-radius-s)", borderWidth: "1px" }}
            >
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold text-xs md:text-sm flex-1" style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}>
                    {u.title}
                  </h3>
                  <span className="text-muted-foreground text-xs whitespace-nowrap ml-2" style={{ fontFamily: "var(--font-sf-rounded)" }}>
                    {relativeTime(u.timestamp)}
                  </span>
                </div>

                <p className="text-muted-foreground text-xs mb-3 line-clamp-2" style={{ fontFamily: "var(--font-sf-rounded)", lineHeight: "150%", letterSpacing: "0.0015em" }}>
                  {u.description}
                </p>

                <div className="flex flex-wrap items-center gap-1 md:gap-2">
                  {category && (
                    <Badge
                      className="bg-blue-600/10 text-blue-300 border-blue-600/20 text-xs"
                      style={{ borderRadius: "var(--wui-border-radius-xs)" }}
                    >
                      {capitalizeStatus(category)}
                    </Badge>
                  )}

                  {u.type && (
                    <Badge className="border-border/30 text-muted-foreground text-xs capitalize bg-white/5" style={{ borderRadius: "var(--wui-border-radius-xs)" }}>
                      {formatActivityType(u.type)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )

          // only wrap with <Link> if we have a valid href string
          return (
            <div key={u.id} className="mb-3 md:mb-4">
              {safeHref ? <Link href={safeHref}>{content}</Link> : content}
            </div>
          )
        })}
      </div>

      <div className="mt-8 mb-16 text-center md:hidden">
        <p className="text-muted-foreground text-xs" style={{ fontFamily: "var(--font-sf-rounded)" }}>
          Pull down to refresh
        </p>
      </div>
    </div>
  )
}
