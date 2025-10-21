"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

type Activity = {
    id: number
    project_id: number
    activity_type: string
    source: string
    title: string | null
    description: string | null
    url: string | null
    author: string | null
    timestamp: string // ISO
}

interface RecentUpdatePopupProps {
    isOpen: boolean
    onClose: () => void
    activity: Activity | null
}

function relTime(iso: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const diffMs = Date.now() - d.getTime()
    const m = Math.floor(diffMs / 60000)
    if (m < 1) return "just now"
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const days = Math.floor(h / 24)
    return `${days}d ago`
}

export default function RecentUpdatePopup({ isOpen, onClose, activity }: RecentUpdatePopupProps) {
    if (!activity) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <DialogTitle className="text-xl font-bold flex-1">
                            {activity.title || activity.activity_type}
                        </DialogTitle>

                        <div className="flex items-center gap-2">
                            <Badge className="border-border/30 text-[10px] text-muted-foreground bg-white/5">
                                {activity.source}
                            </Badge>
                            <Badge className="border-border/30 text-[10px] text-muted-foreground bg-white/5 capitalize">
                                {activity.activity_type}
                            </Badge>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {relTime(activity.timestamp)}
                    </div>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                    {/* Description */}
                    {activity.description && (
                        <div className="p-3 bg-card/30 rounded-lg">
                            <p
                                className="text-sm text-muted-foreground whitespace-pre-wrap"
                                style={{ lineHeight: "150%", letterSpacing: "0.0015em" }}
                            >
                                {activity.description}
                            </p>
                        </div>
                    )}

                    {/* Link (optional) */}
                    {activity.url && (
                        <div>
                            <button
                                className="inline-flex items-center rounded-md border px-3 py-2 text-sm border-border text-muted-foreground hover:bg-[#10c0dd] hover:text-white hover:border-[#10c0dd] transition-colors"
                                onClick={() => window.open(activity.url!, "_blank")}
                            >
                                Open link
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
