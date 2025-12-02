-- Create Projects table with all fields
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    github_repo VARCHAR(255),
    discord_channel VARCHAR(255),
    funding_amount DECIMAL(15, 2),
    start_date DATE,
    end_date DATE,
    assignee_discord_id TEXT,
    last_activity_at TIMESTAMPTZ,
    -- Added all additional project fields from migration scripts
    creator_username VARCHAR(255),
    grantee_email VARCHAR(255),
    category VARCHAR(100),
    program_type VARCHAR(100),
    project_background TEXT,
    mission_expertise TEXT,
    campaign_goals TEXT,
    creator_stat_1_name VARCHAR(255),
    creator_stat_1_number INTEGER,
    creator_stat_2_name VARCHAR(255),
    creator_stat_2_number INTEGER,
    youtube_link VARCHAR(500),
    tiktok_link VARCHAR(500),
    twitter_link VARCHAR(500),
    twitch_link VARCHAR(500),
    website_links TEXT,
    duration VARCHAR(100),
    proposal_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Milestones table with all fields
CREATE TABLE IF NOT EXISTS milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    completion_date DATE,
    -- Added budget and ordinal fields from migration scripts
    budget DECIMAL(15, 2),
    ordinal INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- 'github_commit', 'github_pr', 'discord_message', etc.
    source VARCHAR(50) NOT NULL, -- 'github', 'discord'
    title VARCHAR(255),
    description TEXT,
    url VARCHAR(500),
    author VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB -- Store additional data like commit hash, PR number, etc.
);

-- Consolidated all indexes for optimal performance
-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_creator_username ON projects(creator_username);
CREATE INDEX IF NOT EXISTS idx_projects_grantee_email ON projects(grantee_email);
CREATE INDEX IF NOT EXISTS idx_projects_status_created ON projects(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity ON projects(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_assignee ON projects(assignee_discord_id);

-- Milestones table indexes
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_milestones_project_ordinal ON milestones(project_id, ordinal);
CREATE INDEX IF NOT EXISTS idx_milestones_project_status ON milestones(project_id, status);

-- Activity logs table indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_source ON activity_logs(source);
