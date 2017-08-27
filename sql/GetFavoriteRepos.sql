SELECT repos.name, favorite_repos.fav_datetime FROM repos 
	INNER JOIN favorite_repos
		ON repos.repo_id = favorite_repos.repo_id
WHERE 
favorite_repos.favoriteur_id = (SELECT user_id FROM users WHERE name = @userName)

ORDER BY favorite_repos.fav_datetime DESC LIMIT @limit