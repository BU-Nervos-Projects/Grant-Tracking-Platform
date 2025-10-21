"use client"
import { useState, useMemo } from "react"
import useSWR from "swr"
import { Check, ChevronLeft, ChevronRight, FileText, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import MilestoneDetailsPopup from "@/components/milestone-details-popup"
import RecentUpdatePopup from "@/components/recent-update-popup"
import { useMobile } from "@/hooks/use-mobile"
import {
  capitalizeStatus,
  getStatusColor,
  formatDate,
  getOverdueMessage,
  shouldShowProgressBar,
  formatCompactCurrency,
} from "@/lib/utils"
import { useProject } from "@/hooks/use-project"
import { useProjects } from "@/hooks/use-projects"

// ---------- Activity types / helpers ----------
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

const fetcher = (u: string) =>
  fetch(u).then((r) => {
    if (!r.ok) throw new Error("Failed to load")
    return r.json()
  })

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

// ---------- Project types ----------
interface Project {
  id: number
  name: string
  description: string
  status: string
  category: string
  funding_amount: number
  duration: string
  project_background: string
  mission_expertise: string
  campaign_goals: string
  creator_stat_1_name: string
  creator_stat_1_number: number
  creator_stat_2_name: string
  creator_stat_2_number: number
  youtube_link: string
  tiktok_link: string
  twitter_link: string
  twitch_link: string
  total_milestones: number
  completed_milestones: number
  progress_percentage: number
  start_date: string
  end_date: string
  github_repo?: string
  proposal_link?: string
}

interface Milestone {
  id: number
  ordinal: number
  title: string
  description: string
  status: string
  budget: number
  due_date: string
  completion_date: string
  progress?: number
}

// ---------- Recent Updates list (cards -> open popup on click) ----------
function RecentUpdatesList({
  items,
  onItemClick,
}: {
  items?: Activity[]
  onItemClick: (a: Activity) => void
}) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No recent updates yet</p>
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((u) => {
        return (
          <button
            key={u.id}
            onClick={() => onItemClick(u)}
            className="w-full text-left border border-border/40 rounded-lg p-3 hover:border-[#1b7382] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1b7382]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-white text-sm font-semibold line-clamp-2">{u.title || u.activity_type}</div>
                {u.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">{u.description}</div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge
                    className="border-border/30 text-muted-foreground text-[10px] bg-white/5"
                    style={{ borderRadius: "var(--wui-border-radius-xs)" }}
                  >
                    {u.source}
                  </Badge>
                  <Badge
                    className="border-border/30 text-muted-foreground text-[10px] bg-white/5 capitalize"
                    style={{ borderRadius: "var(--wui-border-radius-xs)" }}
                  >
                    {u.activity_type}
                  </Badge>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground whitespace-nowrap">{relTime(u.timestamp)}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ---------- Carousel (now shows real similar projects) ----------
function OtherProgramsCarousel({ currentProject, allProjects }: { currentProject: any; allProjects: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const isMobile = useMobile()

  const similarProjects = useMemo(() => {
    if (!currentProject || !allProjects) return []
    return allProjects.filter(
      (p) =>
        p.id !== currentProject.id &&
        p.category &&
        currentProject.category &&
        p.category.toLowerCase() === currentProject.category.toLowerCase(),
    )
  }, [currentProject, allProjects])

  const itemsPerPage = isMobile ? 1 : 3
  const maxIndex = useMemo(
    () => Math.max(0, similarProjects.length - itemsPerPage),
    [similarProjects.length, itemsPerPage],
  )
  const visiblePrograms = useMemo(
    () => similarProjects.slice(currentIndex, currentIndex + itemsPerPage),
    [currentIndex, itemsPerPage, similarProjects],
  )

  const nextSlide = () => setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  const prevSlide = () => setCurrentIndex((prev) => Math.max(prev - 1, 0))

  if (similarProjects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No similar projects found in the {currentProject?.category || "same"} category
      </p>
    )
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visiblePrograms.map((project) => (
          <Card
            key={project.id}
            className="bg-background/80 backdrop-blur-sm border-border/50 h-auto min-h-[140px] hover:border-[#1b7382] transition-colors cursor-pointer"
            style={{ borderRadius: "var(--wui-border-radius-s)" }}
          >
            <Link href={`/individual-project?id=${project.id}`} className="block h-full">
              <CardContent className="p-4 h-full flex flex-col">
                <h3
                  className="font-semibold text-white mb-2 break-words"
                  style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                >
                  {(() => {
                    const title = project.name.charAt(0).toUpperCase() + project.name.slice(1)
                    return title.length > 60 ? `${title.slice(0, 60)}...` : title
                  })()}
                </h3>
                <p
                  className="text-sm text-muted-foreground mb-3 flex-1 break-words"
                  style={{ fontFamily: "var(--font-sf-rounded)", lineHeight: "150%", letterSpacing: "0.0015em" }}
                >
                  {project.description && project.description.length > 150
                    ? `${project.description.slice(0, 150)}...`
                    : project.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <Badge
                    className={getStatusColor(project.status)}
                    style={{ borderRadius: "var(--wui-border-radius-xs)" }}
                  >
                    {capitalizeStatus(project.status)}
                  </Badge>
                  <span className="text-sm font-semibold text-white">
                    {project.funding_amount ? formatCompactCurrency(project.funding_amount) : "TBD"}
                  </span>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {similarProjects.length > itemsPerPage && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="border-border text-muted-foreground hover:bg-card bg-transparent disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="border-border text-muted-foreground hover:bg-card bg-transparent disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {similarProjects.length > itemsPerPage && (
        <div className="flex justify-center gap-1 mt-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? "bg-white" : "bg-muted-foreground"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Page ----------
export default function IndividualProjectContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get("id")
  const { project, milestones, isLoading, error } = useProject(projectId)
  const { projects: allProjects } = useProjects()

  // activity feed (recent updates)
  const {
    data: activity,
    error: activityError,
    isLoading: activityLoading,
  } = useSWR<Activity[]>(projectId ? `/api/projects/${projectId}/activity` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })

  // collapsible states
  const [isMilestonesOpenDesktop, setIsMilestonesOpenDesktop] = useState(true)
  const [isMilestonesOpenMobile, setIsMilestonesOpenMobile] = useState(true)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)
  const [isMissionOpen, setIsMissionOpen] = useState(false)
  const [isCampaignGoalsOpen, setIsCampaignGoalsOpen] = useState(false)
  const [isReviewPayoutOpen, setIsReviewPayoutOpen] = useState(false)
  const [isRecentUpdatesOpen, setIsRecentUpdatesOpen] = useState(true)
  const [isPayoutOpen, setIsPayoutOpen] = useState(false)

  // popups
  const [milestonePopup, setMilestonePopup] = useState<{ isOpen: boolean; milestone: any }>({
    isOpen: false,
    milestone: null,
  })
  const [activityPopup, setActivityPopup] = useState<{ isOpen: boolean; activity: Activity | null }>({
    isOpen: false,
    activity: null,
  })

  const earliestOverdueMilestone = useMemo(() => {
    const overdueMilestones = milestones.filter((m) => {
      if (!m.due_date || m.status === "completed") return false
      const due = new Date(m.due_date)
      const now = new Date()
      return due < now
    })
    if (overdueMilestones.length === 0) return null
    return overdueMilestones.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
  }, [milestones])

  const handleMilestoneClick = (milestoneId: number) => {
    const milestone = milestones.find((m) => m.id === milestoneId)
    if (milestone) {
      const mappedMilestone = {
        ...milestone,
        status: milestone.status === "completed" ? "complete" : milestone.status,
        budget: milestone.budget ? `$${milestone.budget.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "TBD",
        dueDate: milestone.due_date ? formatDate(milestone.due_date) : undefined,
        completionDate: milestone.completion_date ? formatDate(milestone.completion_date) : undefined,
      }
      setMilestonePopup({ isOpen: true, milestone: mappedMilestone })
    }
  }

  const handleActivityClick = (a: Activity) => {
    setActivityPopup({ isOpen: true, activity: a })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#10c0dd] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background text-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error || "Project not found"}</p>
          <Link href="/">
            <Button className="bg-[#10c0dd] hover:bg-[#0ea5e9]">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="pt-20 md:pt-24">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-[#10c0dd] transition-colors">
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Projects</span>
            </Link>
            <h1
              className="text-xl md:text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
            >
              Project Details
            </h1>
          </div>

          {(() => {
            if (!earliestOverdueMilestone) return null
            const due = new Date(earliestOverdueMilestone.due_date)
            const now = new Date()
            const diffTime = now.getTime() - due.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return (
              <div className="mb-6">
                <div className="flex items-center gap-3 bg-orange-900/20 border border-orange-600/30 rounded-lg px-6 py-4">
                  <span className="text-orange-400 text-xl flex-shrink-0">⚠️</span>
                  <span className="text-orange-400 font-medium text-base">
                    Overdue since {formatDate(earliestOverdueMilestone.due_date)} ({diffDays} day
                    {diffDays > 1 ? "s" : ""})
                  </span>
                </div>
              </div>
            )
          })()}
        </div>

        <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              {/* Banner */}
              <Card
                className="bg-card/80 backdrop-blur-sm border-border/50 mb-6"
                style={{ borderRadius: "var(--wui-border-radius-m)" }}
              >
                <CardContent className="p-4 md:p-8">
                  <div className="flex items-center justify-center min-h-[128px] md:min-h-[192px] bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                    <div className="text-center px-4 py-4 max-w-full">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-lg md:text-2xl font-bold text-purple-600">
                          {project.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-2 break-words">
                        {project.name.length > 60 ? `${project.name.slice(0, 60)}...` : project.name}
                      </h2>
                      <p
                        className="text-xs sm:text-sm md:text-base text-purple-100 leading-tight sm:leading-normal md:leading-relaxed break-words hyphens-auto max-w-full px-2"
                        style={{ wordWrap: "break-word", overflowWrap: "break-word", lineHeight: "1.3" }}
                      >
                        {project.description.length > 200
                          ? `${project.description.slice(0, 200)}...`
                          : project.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress */}
              <Card
                className="bg-card/80 backdrop-blur-sm border-border/50 mb-6"
                style={{ borderRadius: "var(--wui-border-radius-m)" }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-end mb-2">
                    <span className="text-sm font-semibold text-white">
                      {Math.round(project.progress_percentage || 0)}%
                    </span>
                  </div>
                  <Progress value={project.progress_percentage || 0} className="h-2 bg-border [&>div]:bg-[#10c0dd]" />
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-2 gap-1">
                    <p className="text-xs text-muted-foreground">
                      {project.completed_milestones} of {project.total_milestones} milestones completed
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.funding_amount
                        ? `$${project.funding_amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} allocated`
                        : "Budget TBD"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardContent className="p-4 text-center">
                    <h3 className="text-sm text-muted-foreground mb-1">Budget</h3>
                    <p className="text-lg md:text-xl font-bold text-white">
                      {project.funding_amount
                        ? `$${project.funding_amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                        : "TBD"}
                    </p>
                  </CardContent>
                </Card>
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardContent className="p-4 text-center">
                    <h3 className="text-sm text-muted-foreground mb-1">End Date</h3>
                    <p className="text-lg md:text-xl font-bold text-white">{formatDate(project.end_date)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Background */}
              <Card
                className="bg-card/80 backdrop-blur-sm border-border/50 mb-6 break-words"
                style={{ borderRadius: "var(--wui-border-radius-m)" }}
              >
                <CardHeader>
                  <CardTitle
                    className="text-white text-lg md:text-xl"
                    style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                  >
                    Project Background
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className="text-muted-foreground mb-4 text-sm md:text-base"
                    style={{ fontFamily: "var(--font-sf-rounded)", lineHeight: "150%", letterSpacing: "0.0015em" }}
                  >
                    {project.project_background || project.description}
                  </p>
                  {project.proposal_link && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-muted-foreground hover:bg-[#10c0dd] hover:text-white hover:border-[#10c0dd] bg-transparent transition-colors"
                        onClick={() => window.open(project.proposal_link!, "_blank")}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Proposal
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mission & Expertise */}
              {project.mission_expertise && (
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50 mb-6 break-words"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="text-white text-lg md:text-xl flex items-center justify-between cursor-pointer md:cursor-default"
                      style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                      onClick={() => setIsMissionOpen(!isMissionOpen)}
                    >
                      Mission & Expertise
                      <div className="md:hidden">
                        {isMissionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <div className={`md:block ${isMissionOpen ? "block" : "hidden"}`}>
                    <CardContent>
                      <p
                        className="text-muted-foreground text-sm md:text-base"
                        style={{ fontFamily: "var(--font-sf-rounded)", lineHeight: "150%", letterSpacing: "0.0015em" }}
                      >
                        {project.mission_expertise}
                      </p>
                    </CardContent>
                  </div>
                </Card>
              )}

              {/* Campaign Goals */}
              {project.campaign_goals && (
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50 mb-6 break-words"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="text-white text-lg md:text-xl flex items-center justify-between cursor-pointer md:cursor-default"
                      style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                      onClick={() => setIsCampaignGoalsOpen(!isCampaignGoalsOpen)}
                    >
                      Campaign Goals
                      <div className="md:hidden">
                        {isCampaignGoalsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <div className={`md:block ${isCampaignGoalsOpen ? "block" : "hidden"}`}>
                    <CardContent>
                      <p
                        className="text-muted-foreground text-sm md:text-base"
                        style={{ fontFamily: "var(--font-sf-rounded)", lineHeight: "150%", letterSpacing: "0.0015em" }}
                      >
                        {project.campaign_goals}
                      </p>
                    </CardContent>
                  </div>
                </Card>
              )}

              {/* Mobile: Milestones */}
              <div className="block lg:hidden mb-6">
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="text-white flex items-center justify-between text-lg md:text-xl cursor-pointer"
                      style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                      onClick={() => setIsMilestonesOpenMobile((v) => !v)}
                    >
                      Milestones
                      {isMilestonesOpenMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                  </CardHeader>
                  {isMilestonesOpenMobile && (
                    <CardContent className="space-y-4">
                      {milestones.length > 0 ? (
                        milestones.map((milestone, index) => (
                          <div
                            key={milestone.id}
                            className="space-y-2 cursor-pointer hover:bg-card/50 rounded-lg p-2 -m-2 transition-colors"
                            onClick={() => handleMilestoneClick(milestone.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className="bg-white text-black border-white"
                                style={{ borderRadius: "var(--wui-border-radius-xs)" }}
                              >
                                {String(milestone.ordinal || index + 1).padStart(2, "0")}
                              </Badge>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-white text-sm md:text-base">
                                    {milestone.title}
                                  </span>
                                  <Badge
                                    className={getStatusColor(milestone.status)}
                                    style={{ borderRadius: "var(--wui-border-radius-xs)" }}
                                  >
                                    {capitalizeStatus(milestone.status)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground ml-12">
                              {milestone.description.length > 200
                                ? `${milestone.description.slice(0, 200)}...`
                                : milestone.description}
                            </p>
                            <div className="ml-12">
                              {milestone.status === "completed" && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Check className="w-3 h-3 text-blue-500" />
                                </div>
                              )}
                              {milestone.status === "overdue" && getOverdueMessage(milestone.due_date) && (
                                <div className="mb-2">
                                  <div className="flex items-center gap-2 bg-orange-900/20 border border-orange-600/30 rounded px-3 py-2">
                                    <span className="text-orange-400 text-xs font-medium">
                                      {getOverdueMessage(milestone.due_date)}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {shouldShowProgressBar(milestone.status) && (
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Progress: {milestone.progress || 0}%
                                  </p>
                                  <Progress
                                    value={milestone.progress || 0}
                                    className="h-2 bg-border [&>div]:bg-[#10c0dd]"
                                  />
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground font-bold">
                                  Budget:{" "}
                                  {milestone.budget
                                    ? `$${milestone.budget.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                                    : "TBD"}
                                </p>
                                {milestone.status !== "completed" && milestone.due_date && (
                                  <p className="text-xs text-muted-foreground font-bold">
                                    Due: {formatDate(milestone.due_date)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground text-sm">No milestones created yet</p>
                          <Link href={`/admin/projects/${project.id}/milestones/new`}>
                            <Button size="sm" className="mt-2 bg-[#10c0dd] hover:bg-[#0ea5e9]">
                              Add Milestone
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Mobile: Recent Updates */}
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50 mt-6"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="text-white text-lg md:text-xl flex items-center justify-between cursor-pointer"
                      style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                      onClick={() => setIsRecentUpdatesOpen((v) => !v)}
                    >
                      Recent Updates
                      {isRecentUpdatesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                  </CardHeader>
                  {isRecentUpdatesOpen && (
                    <CardContent>
                      {activityLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                      ) : activityError ? (
                        <p className="text-sm text-red-400 text-center py-4">Failed to load updates</p>
                      ) : (
                        <RecentUpdatesList items={activity} onItemClick={handleActivityClick} />
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Mobile: Review & Payout */}
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50 mt-6"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="text-white text-lg md:text-xl flex items-center justify-between cursor-pointer"
                      style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                      onClick={() => setIsReviewPayoutOpen((v) => !v)}
                    >
                      Review & Payout
                      {isReviewPayoutOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                  </CardHeader>
                  {isReviewPayoutOpen && (
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3 text-base">Reviews</h4>
                        <p className="text-sm text-muted-foreground">No reviews available</p>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-3 text-base">Payouts</h4>
                        <p className="text-sm text-muted-foreground">No payout information available</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>

              {/* Creator Statistics */}
              {(project.creator_stat_1_name || project.creator_stat_2_name) && (
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50 mb-6"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="text-white text-lg md:text-xl"
                      style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                    >
                      Creator Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {project.creator_stat_1_name && (
                        <div className="text-center">
                          <h3 className="text-sm text-muted-foreground mb-1">{project.creator_stat_1_name}</h3>
                          <p className="text-xl md:text-2xl font-bold text-white">
                            {project.creator_stat_1_number?.toLocaleString() || "N/A"}
                          </p>
                        </div>
                      )}
                      {project.creator_stat_2_name && (
                        <div className="text-center">
                          <h3 className="text-sm text-muted-foreground mb-1">{project.creator_stat_2_name}</h3>
                          <p className="text-xl md:text-2xl font-bold text-white">
                            {project.creator_stat_2_number?.toLocaleString() || "N/A"}
                          </p>
                        </div>
                      )}
                    </div>

                    {(project.youtube_link || project.tiktok_link || project.twitter_link || project.twitch_link) && (
                      <div>
                        <h3
                          className="text-white mb-3 text-lg md:text-xl"
                          style={{
                            fontFamily: "var(--font-sf-rounded)",
                            letterSpacing: "0.0025em",
                            lineHeight: "145%",
                          }}
                        >
                          Platform Links
                        </h3>
                        <div className="flex flex-wrap gap-2 md:grid md:grid-cols-2 md:gap-2">
                          {project.youtube_link && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border text-muted-foreground hover:bg-[#10c0dd] hover:text-white hover:border-[#10c0dd] bg-transparent transition-colors flex-shrink-0 px-2 md:px-4"
                              onClick={() => window.open(project.youtube_link, "_blank")}
                            >
                              <svg className="w-4 h-4 md:mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93-.502 5.814a3.016 3.016 0 0 0 2.122 2.136C2.49 19.474 12 19.474 12 19.474s9.505 0 11.997-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                              </svg>
                              <span className="hidden md:inline">YouTube</span>
                            </Button>
                          )}
                          {project.tiktok_link && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border text-muted-foreground hover:bg-[#10c0dd] hover:text-white hover:border-[#10c0dd] bg-transparent transition-colors flex-shrink-0 px-2 md:px-4"
                              onClick={() => window.open(project.tiktok_link, "_blank")}
                            >
                              <svg className="w-4 h-4 md:mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.017 0C5.396 0 .\029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.747 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z" />
                              </svg>
                              <span className="hidden md:inline">TikTok</span>
                            </Button>
                          )}
                          {project.twitter_link && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border text-muted-foreground hover:bg-[#10c0dd] hover:text-white hover:border-[#10c0dd] bg-transparent transition-colors flex-shrink-0 px-2 md:px-4"
                              onClick={() => window.open(project.twitter_link, "_blank")}
                            >
                              <svg className="w-4 h-4 md:mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                              <span className="hidden md:inline">X (Twitter)</span>
                            </Button>
                          )}
                          {project.twitch_link && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border text-muted-foreground hover:bg-[#10c0dd] hover:text-white hover:border-[#10c0dd] bg-transparent transition-colors flex-shrink-0 px-2 md:px-4"
                              onClick={() => window.open(project.twitch_link, "_blank")}
                            >
                              <svg className="w-4 h-4 md:mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zm4.715 9.143H13.286V24h-1.714zm-4.715 0h1.715V24H6.857zm9.428 0H18V24h-1.715z" />
                              </svg>
                              <span className="hidden md:inline">Twitch</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Explore Similar Projects */}
              <Card
                className="bg-card/80 backdrop-blur-sm border-border/50 mb-6"
                style={{ borderRadius: "var(--wui-border-radius-m)" }}
              >
                <CardHeader>
                  <CardTitle
                    className="text-white text-lg md:text-xl"
                    style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                  >
                    Explore Similar Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OtherProgramsCarousel currentProject={project} allProjects={allProjects} />
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar (Desktop) */}
            <div className="lg:col-span-4">
              <div className="hidden lg:block">
                {/* Milestones (desktop) */}
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50 mb-6"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="text-white flex items-center justify-between text-lg md:text-xl cursor-pointer"
                      style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                      onClick={() => setIsMilestonesOpenDesktop((v) => !v)}
                    >
                      Milestones
                      {isMilestonesOpenDesktop ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  {isMilestonesOpenDesktop && (
                    <CardContent className="space-y-4">
                      {milestones.length > 0 ? (
                        milestones.map((milestone, index) => (
                          <div
                            key={milestone.id}
                            className="space-y-2 cursor-pointer hover:bg-card/50 rounded-lg p-2 -m-2 transition-colors"
                            onClick={() => handleMilestoneClick(milestone.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className="bg-white text-black border-white"
                                style={{ borderRadius: "var(--wui-border-radius-xs)" }}
                              >
                                {String(milestone.ordinal || index + 1).padStart(2, "0")}
                              </Badge>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-white text-sm md:text-base">
                                    {milestone.title}
                                  </span>
                                  <Badge
                                    className={getStatusColor(milestone.status)}
                                    style={{ borderRadius: "var(--wui-border-radius-xs)" }}
                                  >
                                    {capitalizeStatus(milestone.status)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground ml-12">
                              {milestone.description.length > 200
                                ? `${milestone.description.slice(0, 200)}...`
                                : milestone.description}
                            </p>
                            <div className="ml-12">
                              {milestone.status === "completed" && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Check className="w-3 h-3 text-blue-500" />
                                </div>
                              )}
                              {milestone.status === "overdue" && getOverdueMessage(milestone.due_date) && (
                                <div className="mb-2">
                                  <div className="flex items-center gap-2 bg-orange-900/20 border border-orange-600/30 rounded px-3 py-2">
                                    <span className="text-orange-400 text-xs font-medium">
                                      {getOverdueMessage(milestone.due_date)}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {shouldShowProgressBar(milestone.status) && (
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Progress: {milestone.progress || 0}%
                                  </p>
                                  <Progress
                                    value={milestone.progress || 0}
                                    className="h-2 bg-border [&>div]:bg-[#10c0dd]"
                                  />
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground font-bold">
                                  Budget:{" "}
                                  {milestone.budget
                                    ? `$${milestone.budget.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                                    : "TBD"}
                                </p>
                                {milestone.status !== "completed" && milestone.due_date && (
                                  <p className="text-xs text-muted-foreground font-bold">
                                    Due: {formatDate(milestone.due_date)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground text-sm">No milestones created yet</p>
                          <Link href={`/admin/projects/${project.id}/milestones/new`}>
                            <Button size="sm" className="mt-2 bg-[#10c0dd] hover:bg-[#0ea5e9]">
                              Add Milestone
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Recent Updates (desktop) */}
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50 mb-6"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="text-white text-lg md:text-xl flex items-center justify-between cursor-pointer"
                      style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                      onClick={() => setIsRecentUpdatesOpen((v) => !v)}
                    >
                      Recent Updates
                      {isRecentUpdatesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                  </CardHeader>
                  {isRecentUpdatesOpen && (
                    <CardContent>
                      {activityLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                      ) : activityError ? (
                        <p className="text-sm text-red-400 text-center py-4">Failed to load updates</p>
                      ) : (
                        <RecentUpdatesList items={activity} onItemClick={handleActivityClick} />
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Reviews */}
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50 mb-6"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="text-white flex items-center justify-between text-lg md:text-xl cursor-pointer"
                      style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                      onClick={() => setIsReviewsOpen((v) => !v)}
                    >
                      Reviews
                      {isReviewsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                  </CardHeader>
                  {isReviewsOpen && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground text-center py-4">No reviews available</p>
                    </CardContent>
                  )}
                </Card>

                {/* Payouts */}
                <Card
                  className="bg-card/80 backdrop-blur-sm border-border/50 mb-6"
                  style={{ borderRadius: "var(--wui-border-radius-m)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="text-white flex items-center justify-between text-lg md:text-xl cursor-pointer"
                      style={{ fontFamily: "var(--font-sf-rounded)", letterSpacing: "0.0025em", lineHeight: "145%" }}
                      onClick={() => setIsPayoutOpen((v) => !v)}
                    >
                      Payouts
                      {isPayoutOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                  </CardHeader>
                  {isPayoutOpen && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground text-center py-4">No payout information available</p>
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popups */}
      <MilestoneDetailsPopup
        isOpen={milestonePopup.isOpen}
        onClose={() => setMilestonePopup({ isOpen: false, milestone: null })}
        milestone={milestonePopup.milestone}
      />
      <RecentUpdatePopup
        isOpen={activityPopup.isOpen}
        onClose={() => setActivityPopup({ isOpen: false, activity: null })}
        activity={activityPopup.activity}
      />
    </div>
  )
}
