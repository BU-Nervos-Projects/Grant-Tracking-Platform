"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-white">
      <div className="pt-20">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage grant projects and track progress</p>
            </div>
            <Link href="/admin/projects/new">
              <Button className="bg-[#10c0dd] hover:bg-[#0ea5e9] text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
