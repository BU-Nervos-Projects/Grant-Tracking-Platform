import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { Project } from "@/lib/types"
import { parseDurationToEndDate } from "@/lib/utils"
import { config } from "@/configs/config"
import { handleApiError, validateStringLength, validateEmail } from "@/lib/api-helpers"

/** === Discord guild-member lookup from creator_username === */

async function resolveDiscordUserIdFromUsername(username?: string) {
  if (!username || !config.discordBotToken || !config.guildId) return null
  try {
    const q = encodeURIComponent(username.trim())
    const resp = await fetch(`https://discord.com/api/v10/guilds/${config.guildId}/members/search?query=${q}&limit=5`, {
      headers: { Authorization: `Bot ${config.discordBotToken}` },
      cache: "no-store",
    })
    if (!resp.ok) {
      return null
    }
    const members = (await resp.json()) as Array<{
      user: { id: string; username?: string; global_name?: string }
      nick?: string
    }>
    if (!Array.isArray(members) || members.length === 0) return null

    const lc = username.toLowerCase()
    const match =
      members.find(
        (m) =>
          (m.user?.username && m.user.username.toLowerCase() === lc) ||
          (m.user?.global_name && m.user.global_name.toLowerCase() === lc) ||
          (m.nick && m.nick.toLowerCase() === lc),
      ) || members[0]

    return match?.user?.id ?? null
  } catch (e) {
    return null
  }
}

export async function GET() {
  try {
    const projects = await sql`
      SELECT 
        p.*,
        COUNT(m.id) as total_milestones,
        COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_milestones,
        CASE 
          WHEN COUNT(m.id) = 0 THEN 0
          ELSE ROUND((COUNT(CASE WHEN m.status = 'completed' THEN 1 END)::numeric / COUNT(m.id)::numeric) * 100, 2)
        END as progress_percentage,
        (
          SELECT status 
          FROM milestones 
          WHERE project_id = p.id 
            AND status != 'completed'
          ORDER BY created_at DESC 
          LIMIT 1
        ) as active_milestone_status
      FROM projects p
      LEFT JOIN milestones m ON p.id = m.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `
    return NextResponse.json(projects)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      status,
      github_repo,
      proposal_link,
      discord_channel,
      funding_amount,
      start_date,
      end_date,
      creator_username,
      grantee_email,
      category,
      program_type,
      mission_expertise,
      campaign_goals,
      creator_stat_1_name,
      creator_stat_1_number,
      creator_stat_2_name,
      creator_stat_2_number,
      youtube_link,
      tiktok_link,
      twitter_link,
      twitch_link,
      website_links,
      duration,
    } = body

    validateStringLength(name, "name", 255)
    validateStringLength(github_repo, "github_repo", 255)
    validateStringLength(discord_channel, "discord_channel", 255)
    validateStringLength(creator_username, "creator_username", 255)
    validateEmail(grantee_email, "grantee_email")
    validateStringLength(creator_stat_1_name, "creator_stat_1_name", 255)
    validateStringLength(creator_stat_2_name, "creator_stat_2_name", 255)
    validateStringLength(category, "category", 100)
    validateStringLength(program_type, "program_type", 100)
    validateStringLength(duration, "duration", 100)
    validateStringLength(youtube_link, "youtube_link", 500)
    validateStringLength(tiktok_link, "tiktok_link", 500)
    validateStringLength(twitter_link, "twitter_link", 500)
    validateStringLength(twitch_link, "twitch_link", 500)

    // Safe coercions
    const safeName = name ? name.substring(0, 255) : null
    const safeGithubRepo = github_repo ? github_repo.substring(0, 255) : null
    const safeDiscordChannel = discord_channel ? discord_channel.substring(0, 255) : null
    const safeCreatorUsername = creator_username ? creator_username.substring(0, 255) : null
    const safeGranteeEmail = grantee_email ? grantee_email.substring(0, 255) : null
    const safeCreatorStat1Name = creator_stat_1_name ? creator_stat_1_name.substring(0, 255) : null
    const safeCreatorStat2Name = creator_stat_2_name ? creator_stat_2_name.substring(0, 255) : null
    const safeCategory = category ? category.substring(0, 100) : null
    const safeProgramType = program_type ? program_type.substring(0, 100) : null
    const safeDuration = duration ? duration.substring(0, 100) : null

    const safeCreatorStat1 =
      creator_stat_1_number != null
        ? Math.min(Math.max(Number.parseInt(creator_stat_1_number), -2147483648), 2147483647)
        : null
    const safeCreatorStat2 =
      creator_stat_2_number != null
        ? Math.min(Math.max(Number.parseInt(creator_stat_2_number), -2147483648), 2147483647)
        : null
    const safeFundingAmount = funding_amount != null ? Number.parseFloat(funding_amount) : null

    // End date from duration if missing
    let calculatedEndDate = end_date
    if (!end_date && safeDuration && start_date) {
      const parsedEndDate = parseDurationToEndDate(start_date, safeDuration)
      if (parsedEndDate) calculatedEndDate = parsedEndDate.toISOString().split("T")[0]
    }

    // Insert project
    const [project] = (await sql`
      INSERT INTO projects (
        name, description, status, github_repo, proposal_link, discord_channel,
        funding_amount, start_date, end_date,
        creator_username, grantee_email, category, program_type,
        project_background, mission_expertise, campaign_goals,
        creator_stat_1_name, creator_stat_1_number, creator_stat_2_name, creator_stat_2_number,
        youtube_link, tiktok_link, twitter_link, twitch_link,
        website_links, duration
      )
      VALUES (
        ${safeName},
        ${description},
        ${status || "active"},
        ${safeGithubRepo},
        ${proposal_link},
        ${safeDiscordChannel},
        ${safeFundingAmount},
        ${start_date},
        ${calculatedEndDate},
        ${safeCreatorUsername},
        ${safeGranteeEmail},
        ${safeCategory},
        ${safeProgramType},
        ${description},
        ${mission_expertise},
        ${campaign_goals},
        ${safeCreatorStat1Name},
        ${safeCreatorStat1},
        ${safeCreatorStat2Name},
        ${safeCreatorStat2},
        ${youtube_link},
        ${tiktok_link},
        ${twitter_link},
        ${twitch_link},
        ${website_links},
        ${safeDuration}
      )
      RETURNING *
    `) as Project[]

    // Resolve Discord ID from username and save it
    if (project?.creator_username) {
      const userId = await resolveDiscordUserIdFromUsername(project.creator_username)
      if (userId) {
        await sql /*sql*/`
          UPDATE projects
          SET assignee_discord_id = ${userId}, updated_at = NOW()
          WHERE id = ${project.id}
        `
        ;(project as any).assignee_discord_id = userId
      }
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
