import { Progress } from "@/components/ui/progress"

interface ProjectProgressProps {
  value: number
  showPercentage?: boolean
  className?: string
}

export function ProjectProgress({ value, showPercentage = false, className }: ProjectProgressProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Progress value={value} className="h-2 bg-border [&>div]:bg-[#10c0dd] flex-1" />
      {showPercentage && <span className="text-sm text-muted-foreground">{Math.round(value)}%</span>}
    </div>
  )
}
