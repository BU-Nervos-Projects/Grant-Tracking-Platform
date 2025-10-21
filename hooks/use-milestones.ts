import useSWR from "swr"
import type { Milestone, ApiResponse } from "@/lib/types"

const fetcher = async (url: string): Promise<Milestone[]> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error(await res.text().catch(() => "Failed to fetch milestones"))
    const json = await res.json()

    // Accept either a bare array OR an ApiResponse-wrapped payload
    if (Array.isArray(json)) return json as Milestone[]
    if (json && Array.isArray(json.data)) return json.data as Milestone[]
    // last resort: empty
    return []
}

export function useMilestones(projectId?: number | null): {
    milestones: Milestone[]
    isLoading: boolean
    error: string | null
    refetch: () => void
} {
    const key = projectId ? `/api/milestones?project_id=${projectId}` : `/api/milestones`
    const { data, error, isLoading, mutate } = useSWR<Milestone[]>(key, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60_000,
    })

    // always return an array
    return {
        milestones: Array.isArray(data) ? data : [],
        isLoading,
        error: error?.message || null,
        refetch: mutate,
    }
}

/** Defensive indexer */
export function indexMilestonesByProjectId(milestones: Milestone[]): Record<number, Milestone[]> {
    const safe = Array.isArray(milestones) ? milestones : []
    return safe.reduce<Record<number, Milestone[]>>((acc, m) => {
        (acc[m.project_id] ||= []).push(m)
        return acc
    }, {})
}
