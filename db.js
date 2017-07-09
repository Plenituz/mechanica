const mysql = require('mysql');
const Q = require('q');
const convert = require('./fileConvert.js');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const DEBUG_QUERIES = true;//TODO change that when you go in prod
const userReposPath = path.join(__dirname, "data", "userRepos");

module.exports = {
	initDB : function(){
		let instructions = [
			`CREATE TABLE IF NOT EXISTS users(
				user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
				name VARCHAR(20) NOT NULL,
				password BINARY(60) NOT NULL,
				email VARCHAR(254) NOT NULL,
				creation_date DATE NOT NULL,
				description TEXT DEFAULT NULL,
				
				PRIMARY KEY(user_id),
				UNIQUE KEY ind_uni_name(name),
				UNIQUE KEY ind_uni_email(email)
			)
			CHARSET=utf8 
			ENGINE=INNODB;`,
			
			`CREATE TABLE IF NOT EXISTS repos(
				repo_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
				admin_id INT UNSIGNED NOT NULL,
				name VARCHAR(40) NOT NULL,
				location TINYTEXT NOT NULL,
				creation_date DATE NOT NULL,
                current_version INT UNSIGNED NOT NULL DEFAULT 0,
				
				PRIMARY KEY(repo_id),
				INDEX ind_admin_id (admin_id),
				INDEX ind_repo_name (name)
			) CHARSET=utf8 ENGINE=INNODB;`, 
			
			`CREATE TABLE IF NOT EXISTS discussions(
				discussion_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
				title TEXT NOT NULL,
				creator_id INT UNSIGNED,
				created_at DATETIME NOT NULL,
				hosting_repo INT UNSIGNED NOT NULL,
				
				PRIMARY KEY(discussion_id),
				INDEX ind_created_at (created_at),
				INDEX ind_creator_id (creator_id),
				INDEX ind_hosting_repo (hosting_repo)
			) CHARSET=utf8 ENGINE=INNODB;`,
			
			`CREATE TABLE IF NOT EXISTS discussion_messages(
				discussion_message_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
				content TEXT NOT NULL,
				creator_id INT UNSIGNED,
				created_at DATETIME NOT NULL,
				hosting_discussion INT UNSIGNED NOT NULL,
				
				PRIMARY KEY(discussion_message_id),
				INDEX ind_creator_id (creator_id),
				INDEX ind_hosting_discussion (hosting_discussion)
			) ENGINE=INNODB CHARSET=utf8;`,
			
			//WARNING the following "IF NOT EXISTS" part in foreign keys only works with mariadb 10.0.2 or later
			"ALTER TABLE repos ADD CONSTRAINT fk_repos_admin_id FOREIGN KEY IF NOT EXISTS (admin_id)"
				+ " REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE;",
			
			"ALTER TABLE discussions ADD CONSTRAINT fk_discussion_creator_id FOREIGN KEY IF NOT EXISTS (creator_id)"
				+ " REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE;",
				
			"ALTER TABLE discussions ADD CONSTRAINT fk_discussion_hosting_repo FOREIGN KEY IF NOT EXISTS (hosting_repo)" 
				+ " REFERENCES repos (repo_id) ON DELETE CASCADE ON UPDATE CASCADE;",
				
			"ALTER TABLE discussion_messages ADD CONSTRAINT fk_discussion_messages_creator_id FOREIGN KEY IF NOT EXISTS (creator_id)"
				+ " REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE;",
				
			"ALTER TABLE discussion_messages ADD CONSTRAINT fk_discussion_messages_hosting_discussion FOREIGN KEY IF NOT EXISTS (hosting_discussion)" 
				+ "REFERENCES discussions (discussion_id) ON DELETE CASCADE ON UPDATE CASCADE;"	
		];	
		
		console.log("start table creation");
		
		module.exports.multiQueryUnsafe(instructions)
		.fail(function(err){
			console.log("error while creating tables: "  + err);
		})
		.fin(function(){
			console.log("end table creation");
		});
	},
	
	createUser : function(name, password, email){
		//password needs to be plain text
		
		//check if the user exists, if it doesn't create it
		return doesEmailExists(email)
		.then(function(exists){
			if(exists){
				throw new SyntaxError("Email address " + email + " already exists");
			}else{
				return doesUserExists(name);
			}
		})
		.then(function(exists){
			if(exists){
				throw new SyntaxError("user " + name + " already exists");
			}else{
				//safe to insert the new user
				return bcrypt.hash(password, saltRounds);
			}
		})
		.then(function(hash){
			let q = "INSERT INTO users VALUES(NULL, ?, ?, ?, NOW(), NULL)";
			return query(q, [name, hash, email]);
		})
		.then(function(){
			return getUserId(name);
		});
	},
	
	createRepo : function(adminName, repoName){
		var userId, location;
		
		return doesUserExists(adminName)
		.then(function(exists){
			if(!exists){
				throw new Error("can't create repo " + repoName + ", user " + adminName + " doesn't exists");
			}else{
				console.log("checking repo existance");
				return doesRepoExists(adminName, repoName);
			}
		})
		.then(function(repoExists){
			if(repoExists){
				throw new Error("can't create repo " + repoName + ", user "+ adminName + " already has a repo with that name");
			}else{
				return getUserId(adminName);
			}
		})
		.then(function(user_id){
			userId = user_id;
			//create all the folders to current version
			location = path.join(userReposPath, adminName, repoName, "current");
			return Q.nfcall(mkdirp, location);
		}).then(function(){
			let sql = "INSERT INTO repos VALUES(NULL, ?, ?, ?, NOW(), 0)";
			//only save the root location (not the current version folder)
			location = path.join(userReposPath, adminName, repoName);
			return query(sql, [userId, repoName, location]);
		});
    },

    deleteRepo : function (adminName, repoName) {
        let q =
            `DELETE FROM repos 
            WHERE name = ? AND admin_id = 
            (
                SELECT user_id FROM users 
                WHERE name = ?
            )`;
        return query(q, [repoName, adminName]);
    },
	
	createMessageInDiscussion : function(content, creatorName, repoAdminName, repoName, discussion_id){
		//check que la discussion_id donné est bien dans ce repo
		let q = 
		`SELECT discussion_id FROM discussions
		WHERE discussion_id = ? AND hosting_repo =  
		(
		SELECT repos.repo_id FROM repos 
			INNER JOIN users
				ON repos.admin_id = users.user_id
		WHERE users.name = ? AND repos.name = ?
		)`;
		return query(q, [discussion_id, repoAdminName, repoName])
		.then(function(results){
			if(!content){
				throw new Error("content of the message can't be empty");
			}
			if(results.length === 0){
				throw new Error("Error creating message in " + repoAdminName + "/" + repoName + ": discussion_id "+ discussion_id + " not found");
			}
			if(results[0].discussion_id != discussion_id){

				throw new Error("discussion id miss match");
			}
			return getUserId(creatorName);
		})
		.then(function(creator_id){
			let q2 = "INSERT INTO discussion_messages VALUES(NULL, ?, ?, NOW(), ?)";
			return query(q2, [content, creator_id, discussion_id]);
		});
	},
	
	createDiscussion : function(userName, repo, title, creatorName){
		var repoId, creatorId;
		
		return getRepoId(userName, repo)
		.then(function(repo_id){
			if(!title){
				throw new Error("title can't be empty");
			}
			repoId = repo_id;
			return getUserId(creatorName);
		})
		.then(function(user_id){
			creatorId = user_id;
			let q = "INSERT INTO discussions VALUES(NULL, ?, ?, NOW(), ?)";
			return query(q, [title, creatorId, repoId]);
		})
		.then(function(emptySet){
			//SELECT MAX(ID) from bugs WHERE user=Me
			let q1 = "SELECT MAX(discussion_id) as message_id FROM discussions WHERE title=? AND creator_id=? AND hosting_repo=?";
			return query(q1, [title, creatorId, repoId]);
			//TODO j'ai peur que le fait de faire cette query dans une autre connection que l'original permettent 
			//a une autre query de ninjater entre deux et de fausser le resultat de MAX()
		})
		.then(function(results){
			console.log(results[0]);
			if(results.length === 0 || results[0] == null){
				throw new Error("error inserting new message");
			}
			return results[0].message_id;
		});
	},
	
	canAuthenticateUser : function(usernameOrEmail, password){
		let q = "SELECT user_id, password FROM users WHERE name=? OR email=?";
		var user_id;

		return query(q, [usernameOrEmail, usernameOrEmail])
		.then(function(results){
			if(results.length === 0){
				throw new SyntaxError("Username or email not found");
			}else if(results.length === 1){
				let passwordHash = results[0].password;
				user_id = results[0].user_id;
				return bcrypt.compare(password, passwordHash.toString());
			}else{
				console.log("BIG PROBLEME USERNAME/EMAIL FOUND PLUSIERUS FOIS");
				throw new SyntaxError("Something went wrong ! Contact us if it persists");
			}
		})
		.then(function(passMatch){
			if(passMatch)
				return user_id;
			else
				throw new SyntaxError("Password doesn't match !");
		});
	},
	
	//no check for user existance here
	getUserId : function(userName){
		let sql = "SELECT user_id FROM users WHERE name=?";
		
		return query(sql, userName)
		.then(function(results){
			if(results.length === 0){
				throw new Error("can't get user id, user " + userName + " doesn't exists");
			}else{
				return results[0].user_id;
			}
		});
	},
	
	getUserInfo : function(user_id){
		let q = "SELECT name, email FROM users WHERE user_id=?";
		return query(q, user_id)
		.then(function(results){
			if(results.length === 0){
				throw new Error("user " + user_id + " not found");
			}else{
				return [results[0].name.toString(), results[0].email.toString()];
			}
		});
	},
	
	getRecentRepos : function(userName, limit){
		let q = 
		`SELECT repos.name, repos.creation_date FROM repos
			INNER JOIN users
				ON repos.admin_id = users.user_id
		WHERE users.name = ?  
		ORDER BY repos.creation_date DESC LIMIT ?`;
		
		return query(q, [userName, limit])
		.then(function(results){
			var list = [];
			results.forEach( row => {
				list.push(row.name.toString());
			});
			return list;
		});
	},
	
	getRecentDiscussions : function(userName, repoName, limit){
		let q = 
		`SELECT discussion_id, title, created_at, creator_id, users.name as creator_name FROM discussions
		INNER JOIN users 
			ON discussions.creator_id = users.user_id
		WHERE hosting_repo = 
		(
			SELECT repos.repo_id FROM repos 
			INNER JOIN users
				ON repos.admin_id = users.user_id
			WHERE users.name = ? AND repos.name = ?
		)
		ORDER BY created_at DESC LIMIT ?`;
		return query(q, [userName, repoName, limit])
		.then(function(results){
			/*if(results.length === 0){
				throw new Error("can't get recent discussions: repo " + userName + "/" + repoName + " not found");
			}*/
			return results;
		});
	},
	
	getRecentMessagesInDiscussion : function(userName, repoName, discussion_id, limit){
		let q = 
		`SELECT discussion_messages.content, discussion_messages.creator_id, 
		discussion_messages.created_at, discussions.title as discussion_title, users.name as creator_name
		FROM discussion_messages
			INNER JOIN discussions
				ON discussion_messages.hosting_discussion = discussions.discussion_id
			INNER JOIN users
				ON discussion_messages.creator_id = users.user_id
		WHERE discussion_messages.hosting_discussion = ? AND discussions.hosting_repo = 
		(
			SELECT repos.repo_id FROM repos 
				INNER JOIN users
					ON repos.admin_id = users.user_id
			WHERE users.name = ? AND repos.name = ?
		)
		ORDER BY created_at DESC LIMIT ?`;
		return query(q, [discussion_id, userName, repoName, limit])
		.then(function(results){
			if(results.length === 0){
				throw new Error("error getting recent messages in " + userName 
					+ "/" + repoName + ", discussion_id=" + discussion_id + ", no messages found");
			}
			return results.reverse();
		});
	},
	
	doesRepoExists : function(adminName, repoName){
		let sql = 
		`SELECT repos.repo_id FROM repos 
			INNER JOIN users
				ON repos.admin_id = users.user_id
		WHERE users.name = ? AND repos.name = ?`;
		
		return query(sql, [adminName, repoName])
		.then(function(results){
			if(results.length > 1){
				console.log("MEGA PROBLEME YA DEUX REPO AVEC LE MEME NOM ET LE MEME ADMIN");
				throw new Error("MEGA PROBLEME YA DEUX REPO AVEC LE MEME NOM ET LE MEME ADMIN");
			}
			return results.length === 1;
		});
	},
	
	getRepoLocation : function(adminName, repoName){
		let q = 
		`SELECT repos.repo_id, repos.location, repos.current_version FROM repos
			INNER JOIN users
				ON repos.admin_id = users.user_id
		WHERE users.name = ? AND repos.name = ?`;
		
		return query(q, [adminName, repoName])
		.then(function(results){
			if(results.length === 0 || results.length > 1){
				throw new Error("repo " + adminName + "/" + repoName + " not found");
			}else{
				return [results[0].repo_id, results[0].location, results[0].current_version];
			}
		});
    },

    incrementVersion : function(repoId) {
        let q =
            `UPDATE repos 
                SET current_version = current_version + 1
                WHERE repo_id = ?`;
        return query(q, repoId);
    },
	
	getRepoId : function(adminName, repoName){
		let sql = 
		`SELECT repos.repo_id FROM repos 
			INNER JOIN users
				ON repos.admin_id = users.user_id
		WHERE users.name = ? AND repos.name = ?`;
		return query(sql, [adminName, repoName])
		.then(function(results){
			if(results.length === 1){
				return results[0].repo_id;
			}else{
				throw new Error("repo " + adminName + "/" + repoName + " not found");
			}
		});
	},
	
	doesEmailExists : function(email){
		let q = "SELECT user_id FROM users WHERE email=?";
		return query(q, email)
		.then(function(results){
			if(results.length > 1){
				console.log("MEGA PROBLEME DE OUF YA DEUX FOIS LE MEME EMAIL DANS LA DB MEC");
				throw new Error("MEGA PROBLEME DE OUF YA DEUX FOIS LE MEME EMAIL DANS LA DB MEC");
			}
			return results.length === 1;
		});
	},
	
	doesUserExists : function(name){
		let sql = "SELECT user_id FROM users WHERE name=?";
		return query(sql, name)
		.then(function(results, fields){
			if(results.length > 1){
				console.log("MEGA PROBLEME DE OUF YA DEUX FOIS LE MEME USER DANS LA DB MEC");
				throw new Error("MEGA PROBLEME DE OUF YA DEUX FOIS LE MEME USER DANS LA DB MEC");
			}
			return results.length === 1;
		});
	},
	
	pool : mysql.createPool({
		connectionLimit : 100,
		host : 'localhost',
		user : 'root',
		password : '',
		database : 'mechanica_db',
		debug : false
	}),
	
	query : function(queryStr, params){
		var deferred = Q.defer();
		
		module.exports.pool.getConnection(function(err, connection){
			
			function onError(err){
				//res.status(100).send("error in connection to data base after");
				connection.removeListener('error', onError);
				connection.release();
				deferred.reject(err);
				return;
			}
			
			if(err){
				deferred.reject(err);
				//res.status(100).send("error in connection to database");
				return;
			}
			
			//console.log("connected as id " + connection.threadId);
			let q = connection.query(queryStr, params, function(err, results, fields){
				connection.release();
				connection.removeListener('error', onError);
				if(!err){
					//console.log("resolving " + connection.threadId);
					deferred.resolve(results, fields);
				}else{
					deferred.reject(err);
				}
			});
			if(DEBUG_QUERIES)
				console.log("query: " + q.sql);

			connection.on('error', onError);
		});
		
		return deferred.promise;
	},
	
	//this is te execute several queries in a row, in order.
	//note that this doesn't garanty all query will be executed together as other 
	//connections can happen in between 
	//this returns the promise at the end of the chain
	multiQueryUnsafe : function(instructions){
		if(instructions.length == 0){
			console.log("length is 0 in multiQueryUnsafe");
			return null;
		}
		var global = 1;
		var promise = query(instructions[0]);
		if(instructions.length == 1){
			return promise;
		}
		
		for(var i = 1; i < instructions.length; i++){
			promise = promise.then(function(results, fields){
				return query(instructions[global++]);
			});
		}
		
		return promise;
	}
}
//proxy for the overly used functions
const query = module.exports.query;
const doesUserExists = module.exports.doesUserExists;
const doesRepoExists = module.exports.doesRepoExists;
const getUserId = module.exports.getUserId;
const doesEmailExists = module.exports.doesEmailExists;
const getRepoId = module.exports.getRepoId;