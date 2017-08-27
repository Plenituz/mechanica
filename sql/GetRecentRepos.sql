SELECT repos.name, repos.creation_date FROM repos
	INNER JOIN users
		ON repos.admin_id = users.user_id
WHERE users.name = @userName  
ORDER BY repos.creation_date DESC LIMIT @limit