DELETE FROM repos 
WHERE name = @repoName AND admin_id = 
(
    SELECT user_id FROM users 
    WHERE name = @adminName
)