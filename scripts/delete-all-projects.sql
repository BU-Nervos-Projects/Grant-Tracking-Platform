-- Delete all projects and related data
-- This will cascade to milestones, team_members, and activity_logs due to foreign key constraints

DELETE FROM projects;

-- Reset the sequence to start from 1 again
ALTER SEQUENCE projects_id_seq RESTART WITH 1;
