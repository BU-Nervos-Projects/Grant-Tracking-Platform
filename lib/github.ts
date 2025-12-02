import "server-only"
import { config } from "@/configs/config"

function ghHeaders() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${config.githubToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
  }
}


export async function hasRecentGitHubActivity(repo: string, sinceISO: string): Promise<boolean> {
  if (!config.githubToken || !repo) return false

  const full = repo.replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "")
  const base = `https://api.github.com/repos/${full}`

  const endpoints = [
    `${base}/commits?since=${encodeURIComponent(sinceISO)}&per_page=1`,
    `${base}/pulls?state=all&sort=updated&direction=desc&per_page=1`,
    `${base}/issues?since=${encodeURIComponent(sinceISO)}&state=all&per_page=1`,
  ]

  for (const url of endpoints) {
    const res = await fetch(url, { headers: ghHeaders(), cache: "no-store" })
    if (!res.ok) continue
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return true
    }
  }
  return false
}
