"use client"

import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { OverdueAlert } from "@/components/ui/overdue-alert"
import { ProjectProgress } from "@/components/ui/project-progress"
import { getOverdueMessage, shouldShowProgressBar, formatDate } from "@/lib/utils"
import type { Milestone } from "@/lib/types"

interface MilestoneListProps {
  milestones: Milestone[]
  onMilestoneClick: (milestoneId: number) => void
}

export function MilestoneList({ milestones, onMilestoneClick }: MilestoneListProps) {
  if (milestones.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground text-sm">No milestones created yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => (
        <div
          key={milestone.id}
          className="space-y-2 cursor-pointer hover:bg-card/50 rounded-lg p-2 -m-2 transition-colors"
          onClick={() => onMilestoneClick(milestone.id)}
        >
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-white text-black border-white"
              style={{ borderRadius: "var(--wui-border-radius-xs)" }}
            >
              {String(milestone.ordinal || index + 1).padStart(2, "0")}
            </Badge>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm md:text-base">{milestone.title}</span>
                <StatusBadge status={milestone.status} />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            {milestone.description.length > 200 ? `${milestone.description.slice(0, 200)}...` : milestone.description}
          </p>
          <div className="ml-12">
            {milestone.status === "completed" && (
              <div className="flex items-center gap-1 mt-1">
                <Check className="w-3 h-3 text-blue-500" />
              </div>
            )}
            {milestone.status === "overdue" && getOverdueMessage(milestone.due_date) && (
              <div className="mb-2">
                <OverdueAlert message={getOverdueMessage(milestone.due_date)!} />
              </div>
            )}

            {shouldShowProgressBar(milestone.status) && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Progress: {milestone.progress || 0}%</p>
                <ProjectProgress value={milestone.progress || 0} />
              </div>
            )}

            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground font-bold">
                Budget:{" "}
                {milestone.budget
                  ? `${milestone.budget.toLocaleString("en-US", { maximumFractionDigits: 0 })} CKB`
                  : "TBD"}
              </p>
              {milestone.status !== "completed" && milestone.due_date && (
                <p className="text-xs text-muted-foreground font-bold">Due: {formatDate(milestone.due_date)}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
