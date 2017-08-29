INSERT INTO discussions 
(title, creator_id, created_at, hosting_repo)
VALUES( 
@title, 
(SELECT user_id FROM users WHERE name = @creatorName), 
NOW(), 
(
	SELECT repos.repo_id FROM repos
		INNER JOIN users 
			ON users.user_id = repos.admin_id
	WHERE 
	users.name = @repoAdminName 
	AND 
	repos.name = @repoName
));
#LAST_INSERT_ID() returns the last created ID in the SAME CONNECTION
#since using multiQuery keeps the connection in between query it's all good
#https://stackoverflow.com/questions/17112852/get-the-new-record-primary-key-id-from-mysql-insert-query
SELECT LAST_INSERT_ID() as created_discussion_id