// Core domain types
export interface Project {  
  readonly id: number
  readonly name: string
  readonly description: string
  readonly status: "active" | "completed" | "on-hold" | 'at-risk'
  readonly github_repo?: string
  readonly discord_channel?: string
  readonly creator_username?: string
  readonly assignee_discord_id?: string
  readonly funding_amount?: number
  readonly start_date?: string
  readonly end_date: string
  readonly created_at: string
  readonly updated_at: string
  readonly total_milestones?: number
  readonly completed_milestones?: number
  readonly progress_percentage?: number
  readonly category?: string
  readonly duration?: string
  readonly grantee_email?: string
  readonly creator_name?: string
  readonly creator_email?: string
  readonly active_milestone_status?: string
  readonly proposal_link?: string
  readonly project_background: string
  readonly mission_expertise: string
  readonly campaign_goals: string
  readonly creator_stat_1_name: string
  readonly creator_stat_1_number: number
  readonly creator_stat_2_name: string
  readonly creator_stat_2_number: number
  readonly youtube_link: string
  readonly tiktok_link: string
  readonly twitter_link: string
  readonly twitch_link: string



}


export interface Milestone {
  readonly id: number
  readonly project_id: number
  readonly ordinal: number
  readonly title: string
  readonly budget: number
  readonly description: string
  readonly due_date: string
  readonly progress?: number
  readonly status: "pending" | "in-progress" | "completed" | "overdue" | "not-started"
  readonly budget_allocated: number
  readonly completion_date: string
  readonly created_at: string
  readonly updated_at: string
}

export interface User {
  readonly id: number
  readonly name: string
  readonly email: string
  readonly role: "admin" | "user"
  readonly created_at: string
}

export interface ActivityLog {
  readonly id: number
  readonly project_id: number
  readonly source: string
  readonly type: string
  readonly content?: string | null
  readonly url?: string | null
  readonly timestamp: string
}

// API response types
export interface ApiResponse<T> {
  readonly data?: T
  readonly error?: string
  readonly message?: string
}

export interface PaginatedResponse<T> {
  readonly data: readonly T[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
  readonly totalPages: number
}

// Extended types for specific use cases
export interface ProjectWithMilestones extends Project {
  readonly milestones: readonly Milestone[]
}

export interface ProjectWithDetails extends Project {
  readonly milestones: readonly Milestone[]
  readonly recent_activity: readonly ActivityLog[]
}

export interface DashboardStats {
  readonly totalProjects: number
  readonly activeProjects: number
  readonly completedProjects: number
  readonly totalFunding: number
  readonly overdueMilestones: number
}

// Webhook types
export interface GitHubWebhookPayload {
  readonly action?: string
  readonly commits?: Array<{
    readonly message: string
    readonly url: string
  }>
  readonly head_commit?: {
    readonly timestamp: string
  }
  readonly pull_request?: {
    readonly title: string
    readonly html_url: string
    readonly created_at: string
  }
  readonly issue?: {
    readonly title: string
    readonly html_url: string
    readonly created_at: string
  }
}

export interface DiscordWebhookPayload {
  readonly content: string
  readonly author: {
    readonly username: string
    readonly id: string
  }
  readonly channel_id: string
  readonly guild_id?: string
  readonly id: string
  readonly timestamp?: string
}
