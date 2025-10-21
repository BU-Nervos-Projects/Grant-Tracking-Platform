"use client"
import { CheckCircle, Clock, AlertTriangle, FileText } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { OverdueAlert } from "@/components/ui/overdue-alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface MilestoneDetailsPopupProps {
  isOpen: boolean
  onClose: () => void
  milestone: {
    id: number
    title: string
    description: string
    status: "complete" | "overdue" | "pending"
    budget: string
    dueDate?: string
    completionDate?: string
    progress?: number
    deliverables?: string[]
    assignee?: string
    notes?: string
  } | null
}

function MilestoneDetailsPopup({ isOpen, onClose, milestone }: MilestoneDetailsPopupProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-blue-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  if (!milestone) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl font-bold flex-1">Milestone Details</DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon(milestone.status)}
              <StatusBadge status={milestone.status} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Header Section */}
          <div className="space-y-4">
            <div>
              <h3
                className="text-white font-semibold text-lg mb-2"
                style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
              >
                {milestone.title}
              </h3>
              <p
                className="text-muted-foreground text-sm"
                style={{ fontFamily: "var(--font-sf-rounded)", lineHeight: "150%", letterSpacing: "0.0015em" }}
              >
                {milestone.description}
              </p>
            </div>
          </div>

          {/* Details Grid - Only showing completion date if available */}
          {milestone.completionDate && (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 p-3 bg-card/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-sm font-semibold text-white">{milestone.completionDate}</p>
                </div>
              </div>
            </div>
          )}

          {/* Deliverables */}
          {milestone.deliverables && milestone.deliverables.length > 0 && (
            <div className="space-y-3">
              <h4
                className="text-white font-semibold flex items-center gap-2"
                style={{ fontFamily: "var(--font-sf-rounded)" }}
              >
                <FileText className="w-4 h-4" />
                Deliverables
              </h4>
              <div className="space-y-2">
                {milestone.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-card/30 rounded">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sf-rounded)" }}>
                      {deliverable}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {milestone.notes && (
            <div className="space-y-3">
              <h4 className="text-white font-semibold" style={{ fontFamily: "var(--font-sf-rounded)" }}>
                Notes
              </h4>
              <div className="p-3 bg-card/30 rounded-lg">
                <p
                  className="text-sm text-muted-foreground"
                  style={{ fontFamily: "var(--font-sf-rounded)", lineHeight: "150%" }}
                >
                  {milestone.notes}
                </p>
              </div>
            </div>
          )}

          {/* Overdue Alert */}
          {milestone.status === "overdue" && (
            <OverdueAlert message="This milestone is overdue. Please review and update the timeline or deliverables" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MilestoneDetailsPopup
