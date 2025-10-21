'use client';
import { Suspense } from "react"
import IndividualProjectContent from "@/components/individual-project-content"

export default function IndividualProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-white pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#10c0dd] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      }
    >
      <IndividualProjectContent />
    </Suspense>
  )
}
