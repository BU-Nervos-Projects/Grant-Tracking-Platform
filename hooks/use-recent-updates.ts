import useSWR from "swr"

export interface RecentUpdate {
  id: number
  project_id: number
  title: string
  description: string
  timestamp: string
  type: string
  project: string
  link: string
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch recent updates")
  }
  return response.json()
}

export function useRecentUpdates() {
  const { data, error, isLoading } = useSWR<RecentUpdate[]>("/api/recent-updates", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 300000, // Cache for 5 minutes
  })

  return {
    updates: data || [],
    isLoading,
    error: error?.message || null,
  }
}
