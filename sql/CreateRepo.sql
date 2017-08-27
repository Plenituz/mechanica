INSERT INTO repos VALUES(NULL, 
(
	SELECT user_id FROM users 
		WHERE name = @adminName
),
@repoName, @location, NOW(), 0)