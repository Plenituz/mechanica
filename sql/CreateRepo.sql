INSERT INTO repos 
(admin_id, name, location, creation_date, current_version)
VALUES( 
(
	SELECT user_id FROM users 
		WHERE name = @adminName
),
@repoName, @location, NOW(), 0)