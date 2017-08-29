INSERT INTO users (name, password, email, creation_date) 
VALUES(@name, @hash, @email, NOW());

SELECT LAST_INSERT_ID() as created_user_id