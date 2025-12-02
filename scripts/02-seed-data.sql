-- Insert sample projects
INSERT INTO projects (name, description, status, github_repo, discord_channel, funding_amount, start_date, end_date) VALUES
('DeFi Analytics Dashboard', 'A comprehensive analytics platform for DeFi protocols with real-time data visualization and portfolio tracking.', 'active', 'https://github.com/example/defi-analytics', 'defi-analytics', 50000.00, '2024-01-15', '2024-06-15'),
('Cross-Chain Bridge Protocol', 'Secure and efficient cross-chain asset transfer protocol supporting multiple blockchain networks.', 'active', 'https://github.com/example/cross-chain-bridge', 'bridge-protocol', 75000.00, '2024-02-01', '2024-08-01'),
('NFT Marketplace Platform', 'Decentralized NFT marketplace with advanced filtering, bidding, and royalty management features.', 'completed', 'https://github.com/example/nft-marketplace', 'nft-marketplace', 40000.00, '2023-09-01', '2024-01-01'),
('Governance Token Framework', 'Flexible governance framework for DAOs with voting mechanisms and proposal management.', 'active', 'https://github.com/example/governance-token', 'governance', 60000.00, '2024-03-01', '2024-09-01');

-- Insert sample milestones
INSERT INTO milestones (project_id, title, description, due_date, status) VALUES
(1, 'MVP Development', 'Complete basic dashboard with core analytics features', '2024-03-15', 'completed'),
(1, 'Advanced Charting', 'Implement advanced charting and visualization components', '2024-04-30', 'in_progress'),
(1, 'Portfolio Integration', 'Add portfolio tracking and management features', '2024-06-01', 'pending'),
(2, 'Protocol Design', 'Complete technical specification and architecture design', '2024-03-01', 'completed'),
(2, 'Smart Contract Development', 'Develop and test core bridge smart contracts', '2024-05-15', 'in_progress'),
(2, 'Security Audit', 'Complete third-party security audit and fixes', '2024-07-01', 'pending'),
(3, 'Platform Launch', 'Deploy marketplace to mainnet', '2023-12-15', 'completed'),
(3, 'Post-Launch Support', 'Bug fixes and performance optimizations', '2024-01-01', 'completed'),
(4, 'Token Contract', 'Deploy governance token smart contract', '2024-04-15', 'in_progress'),
(4, 'Voting Interface', 'Build user interface for proposal voting', '2024-06-01', 'pending');

-- Insert sample activity logs
INSERT INTO activity_logs (project_id, activity_type, source, title, description, url, author, timestamp, metadata) VALUES
(1, 'github_commit', 'github', 'Add portfolio tracking API', 'Implemented REST API endpoints for portfolio data retrieval', 'https://github.com/example/defi-analytics/commit/abc123', 'john_dev', NOW() - INTERVAL '2 hours', '{"commit_hash": "abc123", "files_changed": 5}'),
(1, 'discord_message', 'discord', 'Weekly progress update', 'Shared progress on advanced charting milestone', NULL, 'sarah_pm', NOW() - INTERVAL '1 day', '{"channel": "defi-analytics", "message_id": "msg456"}'),
(2, 'github_pr', 'github', 'Bridge contract optimization', 'Optimized gas usage in cross-chain transfer functions', 'https://github.com/example/cross-chain-bridge/pull/42', 'alice_dev', NOW() - INTERVAL '3 days', '{"pr_number": 42, "status": "merged"}'),
(2, 'discord_message', 'discord', 'Security review discussion', 'Discussed findings from preliminary security review', NULL, 'bob_security', NOW() - INTERVAL '5 days', '{"channel": "bridge-protocol", "message_id": "msg789"}'),
(4, 'github_commit', 'github', 'Update governance parameters', 'Modified voting period and quorum requirements', 'https://github.com/example/governance-token/commit/def456', 'charlie_dev', NOW() - INTERVAL '1 week', '{"commit_hash": "def456", "files_changed": 2}');
