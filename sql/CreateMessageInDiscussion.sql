INSERT INTO discussion_messages 
VALUES(NULL, @content, 
(
	SELECT user_id FROM users
	WHERE name = @creatorName
), 
NOW(), @discussionId)