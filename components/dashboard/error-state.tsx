"use client"

import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  error: string
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-background text-white font-sf-rounded pt-20 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">Error: {error}</p>
        {onRetry && (
          <Button onClick={onRetry} className="bg-[#10c0dd] hover:bg-[#0ea5e9]">
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
