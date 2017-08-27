SELECT discussion_id FROM discussions
WHERE discussion_id = @discussionId AND hosting_repo =  
(
	SELECT repos.repo_id FROM repos 
		INNER JOIN users
			ON repos.admin_id = users.user_id
	WHERE users.name = @adminName AND repos.name = @repoName
)