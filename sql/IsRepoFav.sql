SELECT favorite_repo_id FROM favorite_repos
WHERE 
	favoriteur_id = (SELECT user_id FROM users WHERE name = @connectedUserName)
AND 
	repo_id = 
	(
		SELECT repo_id FROM repos 
		WHERE 
			admin_id = (SELECT user_id FROM users WHERE name = @repoAdminName)
		AND 
			name = @repoName
	)