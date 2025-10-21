"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Calendar, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Project } from "@/lib/db"
import { FormField } from "@/components/forms/form-field"

interface MilestoneData {
  title: string
  description: string
  deadline: string
  budget: string
  status: string
}

export default function NewMilestonePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [milestones, setMilestones] = useState<MilestoneData[]>([
    {
      title: "",
      description: "",
      deadline: "",
      budget: "",
      status: "Active",
    },
  ])

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch project")
        }
        const projectData = await response.json()
        setProject(projectData)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load project details.",
          variant: "destructive",
        })
        router.push("/admin/projects")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchProject()
    }
  }, [params.id, router, toast])

  const handleInputChange = (index: number, field: keyof MilestoneData, value: string) => {
    setMilestones((prev) => prev.map((milestone, i) => (i === index ? { ...milestone, [field]: value } : milestone)))
  }

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        deadline: "",
        budget: "",
        status: "Active",
      },
    ])
  }

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const validMilestones = milestones.filter(
        (milestone) => milestone.title.trim() && milestone.description.trim() && milestone.deadline && milestone.budget,
      )

      if (validMilestones.length === 0) {
        throw new Error("At least one complete milestone is required")
      }

      const createdMilestones = []
      for (let i = 0; i < validMilestones.length; i++) {
        const milestone = validMilestones[i]

        const response = await fetch("/api/milestones", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id: Number.parseInt(params.id as string),
            title: milestone?.title,
            description: milestone?.description,
            due_date: milestone?.deadline,
            status: milestone?.status.toLowerCase(),
            budget: milestone?.budget,
            ordinal: i + 1,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to create milestone: ${milestone?.title}`)
        }

        const created = await response.json()
        createdMilestones.push(created)
      }

      toast({
        title: "Milestones Created",
        description: `Successfully created ${validMilestones.length} milestone(s).`,
      })

      router.push("/admin")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create milestones. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10c0dd] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="pt-20">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href={`/admin/projects/${params.id}`}
              className="flex items-center gap-2 text-white hover:text-[#10c0dd] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Project</span>
            </Link>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#10c0dd] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{project.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg">{project.name}</h2>
                    <p className="text-muted-foreground text-sm">Adding milestones to this project</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-white text-2xl font-bold flex items-center gap-2">
                  <Plus className="w-6 h-6 text-[#10c0dd]" />
                  Create Milestones
                </CardTitle>
                <p className="text-muted-foreground">
                  Add multiple milestones to track progress for this project. All fields marked with * are required.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="space-y-4 p-4 border border-border/50 rounded-lg bg-card/30">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium">Milestone {index + 1}</h3>
                        {milestones.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMilestone(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          id={`title-${index}`}
                          label="Milestone Title"
                          value={milestone.title}
                          onChange={(value) => handleInputChange(index, "title", value)}
                          placeholder="e.g., Project Planning Phase"
                          required
                        />

                        <FormField
                          id={`budget-${index}`}
                          label="Budget (USD)"
                          type="number"
                          value={milestone.budget}
                          onChange={(value) => handleInputChange(index, "budget", value)}
                          placeholder="8333"
                          required
                        />
                      </div>

                      <FormField
                        id={`description-${index}`}
                        label="Milestone Detail"
                        type="textarea"
                        value={milestone.description}
                        onChange={(value) => handleInputChange(index, "description", value)}
                        placeholder="Describe what needs to be accomplished in this milestone..."
                        required
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          id={`deadline-${index}`}
                          label="Deadline"
                          type="date"
                          value={milestone.deadline}
                          onChange={(value) => handleInputChange(index, "deadline", value)}
                          icon={<Calendar className="w-4 h-4" />}
                          required
                        />

                        <FormField
                          id={`status-${index}`}
                          label="Status"
                          type="select"
                          value={milestone.status}
                          onChange={(value) => handleInputChange(index, "status", value)}
                          placeholder="Select status"
                          options={[
                            { value: "Active", label: "Active" },
                            { value: "At Risk", label: "At Risk" },
                            { value: "Overdue", label: "Overdue" },
                            { value: "Completed", label: "Completed" },
                            { value: "Not Started", label: "Not Started" },
                          ]}
                          required
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addMilestone}
                      className="border-[#10c0dd] text-[#10c0dd] hover:bg-[#10c0dd]/10 bg-transparent"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Milestone
                    </Button>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="border-border text-muted-foreground hover:bg-card"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#10c0dd] hover:bg-[#0ea5e9] text-white"
                    >
                      {isSubmitting
                        ? "Creating..."
                        : `Create ${milestones.length} Milestone${milestones.length > 1 ? "s" : ""}`}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
