SELECT discussion_id, title, created_at, creator_id, users.name as creator_name FROM discussions
	INNER JOIN users 
		ON discussions.creator_id = users.user_id
WHERE hosting_repo = 
(
	SELECT repos.repo_id FROM repos 
		INNER JOIN users
			ON repos.admin_id = users.user_id
	WHERE users.name = @adminName AND repos.name = @repoName
)
ORDER BY created_at DESC LIMIT @limit