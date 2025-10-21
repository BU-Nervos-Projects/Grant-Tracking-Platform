import useSWR from "swr"
import type { Project } from "@/lib/types"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch projects")
  }
  return response.json()
}

export function useProjects(): {
  projects: Project[]
  isLoading: boolean
  error: string | null
  refetch: () => void
} {
  const { data, error, isLoading, mutate } = useSWR<Project[]>("/api/projects", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  })

  return {
    projects: data || [],
    isLoading,
    error: error?.message || null,
    refetch: mutate,
  }
}
