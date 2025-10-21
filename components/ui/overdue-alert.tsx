import { AlertTriangle } from "lucide-react"

interface OverdueAlertProps {
  message: string
}

export function OverdueAlert({ message }: OverdueAlertProps) {
  return (
    <div className="flex items-center gap-2 bg-orange-900/20 border border-orange-600/30 rounded px-3 py-2">
      <AlertTriangle className="w-4 h-4 text-orange-500" />
      <span className="text-orange-400 text-xs font-medium">{message}</span>
    </div>
  )
}
