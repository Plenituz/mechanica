INSERT INTO users VALUES(NULL, @name, @hash, @email, NOW(), NULL);
SELECT LAST_INSERT_ID() as created_user_id