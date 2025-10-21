// components/dashboard/project-grid.tsx
"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { ProjectProgress } from "@/components/ui/project-progress"
import { formatCompactCurrency } from "@/lib/client-utils"
import { capitalizeStatus } from "@/lib/utils"
import type { Milestone, Project } from "@/lib/types"

/** Props: pass paginated Projects and the (global or page) Milestones list */
interface ProjectGridProps {
  projects: Project[]
  milestones: Milestone[]
}

/** normalize statuses like "Not Started", "not_started" -> "not-started" */
function norm(s?: string) {
  return (s || "").trim().toLowerCase().replace(/[_\s]+/g, "-")
}

/**
 * Fallback display status when a project has no milestones:
 * Priority:
 *  1) "active" if project.active_milestone_status OR project.status is "active"
 *  2) otherwise project.active_milestone_status (if present)
 *  3) otherwise project.status
 *  4) default "pending"
 */
function pickDisplayStatus(p: Project): string {
  const ms = norm((p as any).active_milestone_status) // keep type flexible
  const ps = norm(p.status)

  if (ms === "active" || ps === "active") return "active"
  if (ms) return ms
  if (ps) return ps
  return "pending"
}

/** Given milestones for a project, compute the status to show on the card */
function computeStatusFromMilestones(list: Milestone[]): string {
  if (!list.length) return "pending"
  // First milestone that is NOT completed is the "current"
  const current = list.find((m) => m.status?.toLowerCase() !== "completed")
  return current ? current.status.toLowerCase() : "completed"
}

export const ProjectGrid = React.memo(function ProjectGrid({ projects, milestones }: ProjectGridProps) {
  // Index milestones by project_id once for O(1) lookups while rendering each card
  const milestonesByProject = useMemo(() => {
    const map = new Map<number, Milestone[]>()
    for (const m of milestones) {
      const arr = map.get(m.project_id)
      if (arr) arr.push(m)
      else map.set(m.project_id, [m])
    }
    // Keep each project's milestones sorted (ordinal ASC, fallback to id)
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.ordinal ?? a.id) - (b.ordinal ?? b.id))
    }
    return map
  }, [milestones])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {projects.map((project) => {
        const msList = milestonesByProject.get(project.id) ?? []
        const displayStatus = msList.length
          ? computeStatusFromMilestones(msList)
          : pickDisplayStatus(project)

        return (
          <Card
            key={project.id}
            className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-[#1b7382] transition-colors duration-300 group"
            style={{ borderRadius: "var(--wui-border-radius-m)", borderWidth: "1px" }}
          >
            <Link href={`/individual-project?id=${project.id}`} className="block cursor-pointer h-full">
              <CardContent className="p-4 md:p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3
                    className="text-white font-semibold text-base md:text-lg"
                    style={{
                      fontFamily: "var(--font-sf-rounded)",
                      letterSpacing: "0.0025em",
                      lineHeight: "145%",
                    }}
                  >
                    {(() => {
                      const title = project.name.charAt(0).toUpperCase() + project.name.slice(1)
                      return title.length > 60 ? `${title.slice(0, 60)}...` : title
                    })()}
                  </h3>

                  <StatusBadge status={displayStatus} className="text-xs" />
                </div>

                <p
                  className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4 flex-1 break-words"
                  style={{
                    fontFamily: "var(--font-sf-rounded)",
                    lineHeight: "150%",
                    letterSpacing: "0.0015em",
                  }}
                >
                  {project.description && project.description.length > 200
                    ? `${project.description.slice(0, 200)}...`
                    : project.description}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-xs md:text-sm" style={{ fontFamily: "var(--font-sf-rounded)" }}>
                    Budget:{" "}
                    {typeof project.funding_amount === "number"
                      ? formatCompactCurrency(project.funding_amount)
                      : "N/A"}
                  </span>
                  <span
                    className="text-muted-foreground text-xs md:text-sm"
                    style={{ fontFamily: "var(--font-sf-rounded)" }}
                  >
                    {project.duration || "Duration: TBD"}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-600/10 text-blue-300 border-blue-600/20 text-xs"
                    style={{ borderRadius: "var(--wui-border-radius-xs)" }}
                  >
                    {capitalizeStatus(project.category || "General")}
                  </Badge>
                  <span
                    className="text-white font-semibold text-xs md:text-sm"
                    style={{ fontFamily: "var(--font-sf-rounded)" }}
                  >
                    {Math.round(project.progress_percentage || 0)}%
                  </span>
                </div>

                <ProjectProgress value={project.progress_percentage || 0} />
              </CardContent>
            </Link>
          </Card>
        )
      })}
    </div>
  )
})
