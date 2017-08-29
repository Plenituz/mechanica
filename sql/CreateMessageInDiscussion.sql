INSERT INTO discussion_messages 
(content, creator_id, created_at, hosting_discussion)
VALUES(@content, 
(
	SELECT user_id FROM users
	WHERE name = @creatorName
), 
NOW(), @discussionId)