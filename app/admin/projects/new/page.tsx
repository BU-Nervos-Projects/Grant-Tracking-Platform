"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { FormField } from "@/components/forms/form-field"

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    creatorUsername: "",
    granteeEmail: "",
    background: "",
    missionExpertise: "",
    campaignGoals: "",
    fundingRequested: "",
    githubRepo: "",
    proposalLink: "",
    websiteLinks: "",
    programType: "",
    category: "",
    duration: "",
    creatorStat1Name: "",
    creatorStat1Number: "",
    creatorStat2Name: "",
    creatorStat2Number: "",
    youtubeLink: "",
    tiktokLink: "",
    twitterLink: "",
    twitchLink: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.title,
          description: formData.background,
          github_repo: formData.githubRepo,
          proposal_link: formData.proposalLink,
          discord_channel: formData.creatorUsername,
          funding_amount: Number.parseFloat(formData.fundingRequested) || 0,
          start_date: new Date().toISOString().split("T")[0],
          end_date: null,
          creator_username: formData.creatorUsername,
          grantee_email: formData.granteeEmail,
          mission_expertise: formData.missionExpertise,
          campaign_goals: formData.campaignGoals,
          website_links: formData.websiteLinks,
          program_type: formData.programType,
          category: formData.category,
          duration: formData.duration,
          creator_stat_1_name: formData.creatorStat1Name,
          creator_stat_1_number: formData.creatorStat1Number ? Number.parseInt(formData.creatorStat1Number) : null,
          creator_stat_2_name: formData.creatorStat2Name,
          creator_stat_2_number: formData.creatorStat2Number ? Number.parseInt(formData.creatorStat2Number) : null,
          youtube_link: formData.youtubeLink,
          tiktok_link: formData.tiktokLink,
          twitter_link: formData.twitterLink,
          twitch_link: formData.twitchLink,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create project")
      }

      const project = await response.json()

      toast({
        title: "Project Created",
        description: `${formData.title} has been successfully created.`,
      })

      router.push(`/admin/projects/${project.id}/milestones/new`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="pt-20">
        <div className="container mx-auto px-4 md:px-6 py-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin" className="flex items-center gap-2 text-white hover:text-[#10c0dd] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin</span>
            </Link>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-white text-2xl font-bold flex items-center gap-2">
                  <Plus className="w-6 h-6 text-[#10c0dd]" />
                  Create New Project
                </CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below to create a new grant project. All fields marked with * are required.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormField
                    id="title"
                    label="Project Title"
                    value={formData.title}
                    onChange={(value) => handleInputChange("title", value)}
                    placeholder="Enter project title"
                    required
                  />

                  <FormField
                    id="creatorUsername"
                    label="Creator Username (Discord)"
                    value={formData.creatorUsername}
                    onChange={(value) => handleInputChange("creatorUsername", value)}
                    placeholder="Discord username for authentication"
                    required
                  />

                  <FormField
                    id="granteeEmail"
                    label="Grantee Email"
                    type="email"
                    value={formData.granteeEmail}
                    onChange={(value) => handleInputChange("granteeEmail", value)}
                    placeholder="grantee@example.com"
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      id="category"
                      label="Category"
                      type="select"
                      value={formData.category}
                      onChange={(value) => handleInputChange("category", value)}
                      placeholder="Select category"
                      options={[
                        { value: "development", label: "Development" },
                        { value: "education", label: "Education" },
                        { value: "infrastructure", label: "Infrastructure" },
                        { value: "content", label: "Content" },
                        { value: "research", label: "Research" },
                        { value: "technology", label: "Technology" },
                      ]}
                      required
                    />
                  </div>

                  <FormField
                    id="programType"
                    label="Program Type"
                    type="select"
                    value={formData.programType}
                    onChange={(value) => handleInputChange("programType", value)}
                    placeholder="Select program type"
                    options={[
                      { value: "milestone", label: "Milestone-based Program" },
                      { value: "program", label: "Program with Sub-projects" },
                    ]}
                    helpText="Milestone-based programs track progress through milestones. Programs with sub-projects contain multiple projects instead of milestones."
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      id="fundingRequested"
                      label="Budget"
                      type="number"
                      value={formData.fundingRequested}
                      onChange={(value) => handleInputChange("fundingRequested", value)}
                      placeholder="25000"
                      required
                    />

                    <FormField
                      id="duration"
                      label="Duration"
                      value={formData.duration}
                      onChange={(value) => handleInputChange("duration", value)}
                      placeholder="e.g., 1 year, 6 months, 3 weeks"
                      required
                    />
                  </div>

                  <FormField
                    id="background"
                    label="Project Background"
                    type="textarea"
                    value={formData.background}
                    onChange={(value) => handleInputChange("background", value)}
                    placeholder="Describe the project background and context..."
                    required
                  />

                  <FormField
                    id="missionExpertise"
                    label="Mission & Expertise"
                    type="textarea"
                    value={formData.missionExpertise}
                    onChange={(value) => handleInputChange("missionExpertise", value)}
                    placeholder="Describe the mission and team expertise..."
                    required
                  />

                  <FormField
                    id="campaignGoals"
                    label="Campaign Goals"
                    type="textarea"
                    value={formData.campaignGoals}
                    onChange={(value) => handleInputChange("campaignGoals", value)}
                    placeholder="Describe the campaign goals and expected outcomes..."
                    required
                  />

                  <div className="space-y-4">
                    <h3 className="text-white font-medium text-lg">Creator Statistics (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        id="creatorStat1Name"
                        label="Statistic 1 Name"
                        value={formData.creatorStat1Name}
                        onChange={(value) => handleInputChange("creatorStat1Name", value)}
                        placeholder="e.g., GitHub Stars, Followers, etc."
                      />
                      <FormField
                        id="creatorStat1Number"
                        label="Statistic 1 Number"
                        type="number"
                        value={formData.creatorStat1Number}
                        onChange={(value) => handleInputChange("creatorStat1Number", value)}
                        placeholder="1000"
                      />

                      <FormField
                        id="creatorStat2Name"
                        label="Statistic 2 Name"
                        value={formData.creatorStat2Name}
                        onChange={(value) => handleInputChange("creatorStat2Name", value)}
                        placeholder="e.g., Years Experience, Projects, etc."
                      />
                      <FormField
                        id="creatorStat2Number"
                        label="Statistic 2 Number"
                        type="number"
                        value={formData.creatorStat2Number}
                        onChange={(value) => handleInputChange("creatorStat2Number", value)}
                        placeholder="5"
                      />
                    </div>
                  </div>

                  <FormField
                    id="githubRepo"
                    label="GitHub Repository Link"
                    type="url"
                    value={formData.githubRepo}
                    onChange={(value) => handleInputChange("githubRepo", value)}
                    placeholder="https://github.com/username/repository"
                  />

                  <FormField
                    id="proposalLink"
                    label="Proposal Link"
                    type="url"
                    value={formData.proposalLink}
                    onChange={(value) => handleInputChange("proposalLink", value)}
                    placeholder="https://example.com/proposal-document"
                    helpText="Optional: Link to the original project proposal document"
                  />

                  <div className="space-y-4">
                    <h3 className="text-white font-medium text-lg">Platform Links (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        id="youtubeLink"
                        label="YouTube"
                        type="url"
                        value={formData.youtubeLink}
                        onChange={(value) => handleInputChange("youtubeLink", value)}
                        placeholder="https://youtube.com/@username"
                      />

                      <FormField
                        id="tiktokLink"
                        label="TikTok"
                        type="url"
                        value={formData.tiktokLink}
                        onChange={(value) => handleInputChange("tiktokLink", value)}
                        placeholder="https://tiktok.com/@username"
                      />

                      <FormField
                        id="twitterLink"
                        label="X/Twitter"
                        type="url"
                        value={formData.twitterLink}
                        onChange={(value) => handleInputChange("twitterLink", value)}
                        placeholder="https://x.com/username"
                      />

                      <FormField
                        id="twitchLink"
                        label="Twitch"
                        type="url"
                        value={formData.twitchLink}
                        onChange={(value) => handleInputChange("twitchLink", value)}
                        placeholder="https://twitch.tv/username"
                      />
                    </div>
                  </div>

                  <FormField
                    id="websiteLinks"
                    label="Website / Platform Links"
                    type="textarea"
                    value={formData.websiteLinks}
                    onChange={(value) => handleInputChange("websiteLinks", value)}
                    placeholder="Enter website URLs, social media links, etc. (one per line)"
                    helpText="Optional: Add website, social media, or other platform links (one per line)"
                  />

                  {/* Submit Button */}
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
                      {isSubmitting ? "Creating..." : "Create Project"}
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
