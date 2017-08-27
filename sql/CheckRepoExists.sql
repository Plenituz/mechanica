SELECT repos.repo_id FROM repos
	INNER JOIN users 
		ON users.user_id = repos.admin_id
WHERE 
users.name = @adminName
AND 
repos.name = @repoName