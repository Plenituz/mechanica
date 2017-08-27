INSERT INTO favorite_repos 
VALUES(
NULL, 
(SELECT user_id FROM users WHERE name = @favoriteurName), 
(
	SELECT repo_id FROM repos 
	WHERE 
		admin_id = (SELECT user_id FROM users WHERE name = @repoAdminName)
	AND 
		name = @repoName
), 
NOW())