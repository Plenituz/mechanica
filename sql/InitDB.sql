CREATE TABLE IF NOT EXISTS users(
	user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	name VARCHAR(20) NOT NULL,
	password BINARY(60) NOT NULL,
	email VARCHAR(254) NOT NULL,
	creation_date DATE NOT NULL,
	description TEXT DEFAULT NULL,
	profile_pic_location TINYTEXT DEFAULT '/imgs/default_profile_pic.png',
				
	PRIMARY KEY(user_id),
	UNIQUE KEY ind_uni_name(name),
	UNIQUE KEY ind_uni_email(email)
)
CHARSET=utf8 ENGINE=INNODB;
			
CREATE TABLE IF NOT EXISTS repos(
	repo_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	admin_id INT UNSIGNED NOT NULL,
	name VARCHAR(40) NOT NULL,
	location TINYTEXT NOT NULL,
	creation_date DATE NOT NULL,
    current_version INT UNSIGNED NOT NULL DEFAULT 0,
				
	PRIMARY KEY(repo_id),
	INDEX ind_admin_id (admin_id),
	INDEX ind_repo_name (name),
	UNIQUE KEY unik_admin_id_name (admin_id, name)
) CHARSET=utf8 ENGINE=INNODB;
			
CREATE TABLE IF NOT EXISTS discussions(
	discussion_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	title TEXT NOT NULL,
	creator_id INT UNSIGNED,
	created_at DATETIME NOT NULL,
	hosting_repo INT UNSIGNED NOT NULL,
				
	PRIMARY KEY(discussion_id),
	INDEX ind_created_at (created_at),
	INDEX ind_creator_id (creator_id),
	INDEX ind_hosting_repo (hosting_repo)
) CHARSET=utf8 ENGINE=INNODB;
			
CREATE TABLE IF NOT EXISTS discussion_messages(
	discussion_message_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	content TEXT NOT NULL,
	creator_id INT UNSIGNED,
	created_at DATETIME NOT NULL,
	hosting_discussion INT UNSIGNED NOT NULL,
				
	PRIMARY KEY(discussion_message_id),
	INDEX ind_creator_id (creator_id),
	INDEX ind_hosting_discussion (hosting_discussion)
) ENGINE=INNODB CHARSET=utf8;

CREATE TABLE IF NOT EXISTS favorite_repos(
    favorite_repo_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    favoriteur_id INT UNSIGNED,
    repo_id INT UNSIGNED,
    fav_datetime DATETIME NOT NULL,

    PRIMARY KEY(favorite_repo_id),
    INDEX ind_favoriteur_id (favoriteur_id),
    INDEX ind_repo_id (repo_id),
    UNIQUE KEY unik_repo_id_favoriteur_id (repo_id, favoriteur_id)
    ) CHARSET=utf8 ENGINE=INNODB;
			
#WARNING the following "IF NOT EXISTS" part in foreign keys only works with mariadb 10.0.2 or later
ALTER TABLE repos 
ADD CONSTRAINT fk_repos_admin_id
    FOREIGN KEY IF NOT EXISTS (admin_id)
    REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
			
ALTER TABLE discussions 
ADD CONSTRAINT fk_discussion_creator_id
    FOREIGN KEY IF NOT EXISTS (creator_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
				
ALTER TABLE discussions 
    ADD CONSTRAINT fk_discussion_hosting_repo
    FOREIGN KEY IF NOT EXISTS (hosting_repo)
    REFERENCES repos (repo_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
				
ALTER TABLE discussion_messages 
ADD CONSTRAINT fk_discussion_messages_creator_id
    FOREIGN KEY IF NOT EXISTS (creator_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
				
ALTER TABLE discussion_messages
ADD CONSTRAINT fk_discussion_messages_hosting_discussion
    FOREIGN KEY IF NOT EXISTS (hosting_discussion) 
    REFERENCES discussions (discussion_id) 
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE favorite_repos
    ADD CONSTRAINT fk_favorite_repos_favoriteur_id
    FOREIGN KEY IF NOT EXISTS (favoriteur_id)
    REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE favorite_repos
ADD CONSTRAINT fk_favorite_repos_repo_id
    FOREIGN KEY IF NOT EXISTS (repo_id)
    REFERENCES repos (repo_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;