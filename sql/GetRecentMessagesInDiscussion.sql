SELECT discussion_messages.content, discussion_messages.creator_id, 
	discussion_messages.created_at, discussions.title as discussion_title, users.name as creator_name
FROM discussion_messages
	INNER JOIN discussions
		ON discussion_messages.hosting_discussion = discussions.discussion_id
	INNER JOIN users
		ON discussion_messages.creator_id = users.user_id
WHERE 
discussion_messages.hosting_discussion = @discussionId 
AND 
discussions.hosting_repo = 
(
	SELECT repos.repo_id FROM repos 
		INNER JOIN users
			ON repos.admin_id = users.user_id
	WHERE users.name = @adminName AND repos.name = @repoName
)
ORDER BY created_at DESC LIMIT @limit