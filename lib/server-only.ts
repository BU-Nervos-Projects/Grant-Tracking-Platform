// This file ensures backend logic cannot be imported in client components
import "server-only"

export { sql } from "@/lib/db"
export { config } from "@/configs/config"
export { hasRecentGitHubActivity } from "@/lib/github"
