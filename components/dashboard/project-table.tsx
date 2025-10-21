"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { ProjectProgress } from "@/components/ui/project-progress"
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCompactCurrency, capitalizeStatus } from "@/lib/utils"
import type { Project, Milestone } from "@/lib/types"

interface ProjectTableProps {
  projects: Project[]
  /** Optional: provide milestones to compute display status just like ProjectGrid */
  milestones?: Milestone[]
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

/** Given milestones for a project, compute the status to show (same as grid) */
function computeStatusFromMilestones(list: Milestone[]): string {
  if (!list.length) return "pending"
  // First milestone that is NOT completed is the "current"
  const current = list.find((m) => m.status?.toLowerCase() !== "completed")
  return current ? current.status.toLowerCase() : "completed"
}

export const ProjectTable = React.memo(function ProjectTable({
  projects,
  milestones = [],
}: ProjectTableProps) {
  const router = useRouter()

  // Build a quick index of milestones by project_id (same philosophy as grid)
  const milestonesByProject = React.useMemo(() => {
    const map = new Map<number, Milestone[]>()
    for (const m of milestones) {
      const arr = map.get(m.project_id)
      if (arr) arr.push(m)
      else map.set(m.project_id, [m])
    }
    // Keep sorted for deterministic current-milestone decision
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.ordinal ?? a.id) - (b.ordinal ?? b.id))
    }
    return map
  }, [milestones])

  return (
    <div className="overflow-x-auto">
      <div
        className="border border-border/50 overflow-hidden bg-card/80 backdrop-blur-sm min-w-[800px]"
        style={{ borderRadius: "var(--wui-border-radius-s)" }}
      >
        <ShadcnTable>
          <TableHeader>
            <TableRow className="border-border bg-card">
              <TableHead className="text-muted-foreground">Project Name</TableHead>
              <TableHead className="text-muted-foreground">Creator</TableHead>
              <TableHead className="text-muted-foreground">Category</TableHead>
              <TableHead className="text-muted-foreground">Funding</TableHead>
              <TableHead className="text-muted-foreground">Duration</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const msList = milestonesByProject.get(project.id) ?? []
              const displayStatus = msList.length
                ? computeStatusFromMilestones(msList)
                : pickDisplayStatus(project)

              return (
                <TableRow
                  key={project.id}
                  className="border-border hover:bg-card/50 transition-colors duration-300 cursor-pointer"
                  onClick={() => router.push(`/individual-project?id=${project.id}`)}
                >
                  <TableCell className="font-medium text-white hover:underline max-w-[200px]">
                    <div className="line-clamp-2" title={project.name}>
                      {project.name}
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground max-w-[150px]">
                    <div className="line-clamp-2" title={project.creator_username || "N/A"}>
                      {project.creator_username || "N/A"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-border text-muted-foreground transition-all duration-300"
                    >
                      {capitalizeStatus(project.category || "General")}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {project.funding_amount ? formatCompactCurrency(project.funding_amount) : "N/A"}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {project.duration || "TBD"}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {/* EXACT same usage as in ProjectGrid */}
                    <StatusBadge status={displayStatus} className="text-xs" />
                  </TableCell>

                  <TableCell>
                    <ProjectProgress value={project.progress_percentage || 0} showPercentage />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </ShadcnTable>
      </div>
    </div>
  )
})
