SELECT repos.repo_id, repos.location, repos.current_version FROM repos
	INNER JOIN users
		ON repos.admin_id = users.user_id
WHERE users.name = @adminName AND repos.name = @repoName