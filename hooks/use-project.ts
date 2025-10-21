import { Milestone, Project } from "@/lib/types"
import useSWR from "swr"

// export interface Project {
//   id: number
//   name: string
//   description: string
//   status: string
//   category: string
//   funding_amount: number
//   duration: string
//   project_background: string
//   creator_username: string
//   mission_expertise: string
//   campaign_goals: string
//   creator_stat_1_name: string
//   creator_stat_1_number: number
//   creator_stat_2_name: string
//   creator_stat_2_number: number
//   youtube_link: string
//   tiktok_link: string
//   twitter_link: string
//   twitch_link: string
//   total_milestones: number
//   completed_milestones: number
//   progress_percentage: number
//   start_date: string
//   end_date: string
//   github_repo?: string
//   proposal_link?: string
// }

// export interface Milestone {
//   id: number
//   ordinal: number
//   title: string
//   description: string
//   status: string
//   budget: number
//   due_date: string
//   completion_date: string
//   progress?: number
// }

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch data")
  }
  return response.json()
}

export function useProject(projectId: string | null) {
  const {
    data: project,
    error: projectError,
    isLoading: projectLoading,
  } = useSWR<Project>(projectId ? `/api/projects/${projectId}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  })

  const {
    data: milestones,
    error: milestonesError,
    isLoading: milestonesLoading,
  } = useSWR<Milestone[]>(projectId ? `/api/projects/${projectId}/milestones` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  })

  return {
    project: project || null,
    milestones: milestones || [],
    isLoading: projectLoading || milestonesLoading,
    error: projectError?.message || milestonesError?.message || null,
  }
}
