import { Badge } from "@/components/ui/badge"
import { getStatusColor, capitalizeStatus } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      className={`${getStatusColor(status)} ${className || ""}`}
      style={{ borderRadius: "var(--wui-border-radius-xs)" }}
    >
      {capitalizeStatus(status)}
    </Badge>
  )
}
