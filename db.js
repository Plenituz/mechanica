const mysql = require('mysql');
const Q = require('q');
const convert = require('./fileConvert.js');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const DEBUG_QUERIES = true;//TODO change that when you go in prod
const userReposPath = path.join(__dirname, "data", "userRepos");

module.exports = {
	initDB : function(){
		let instructions = [
			`CREATE TABLE IF NOT EXISTS users(
				user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
				name VARCHAR(20) NOT NULL,
				password TEXT NOT NULL,
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
				discussion_list TEXT,
				
				PRIMARY KEY(repo_id)
			) CHARSET=utf8 ENGINE=INNODB;`, 
			
			`CREATE TABLE IF NOT EXISTS discussions(
				discussion_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
				title TEXT NOT NULL,
				creator_id INT UNSIGNED,
				created_at DATETIME NOT NULL,
				hosting_repo INT UNSIGNED NOT NULL,
				message_list TEXT,
				
				PRIMARY KEY(discussion_id)
			) CHARSET=utf8 ENGINE=INNODB;`,
			
			`CREATE TABLE IF NOT EXISTS discussion_messages(
				discussion_message_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
				content TEXT NOT NULL,
				creator_id INT UNSIGNED,
				created_at DATETIME NOT NULL,
				hosting_discussion INT UNSIGNED NOT NULL,
				
				PRIMARY KEY(discussion_message_id)
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
		
		//check if the user exists, if it doesn't create it
		return doesUserExists(name)
		.then(function(exists){
			if(exists){
				throw new Error("user " + name + " already exists");
			}else{
				//safe to insert the new user
				let q = "INSERT INTO users VALUES(NULL, ?, ?, ?, NOW(), NULL)";
				return query(q, [name, password, email]);
			}
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
			location = path.join(userReposPath, adminName, repoName);
			return Q.nfcall(mkdirp, location);
		}).then(function(){
			let sql = "INSERT INTO repos VALUES(NULL, ?, ?, ?, NOW(), NULL)";
			return query(sql, [userId, repoName, location]);
		});
	},
	
	//no check for user existance here
	getUserId : function(userName){
		let sql = "SELECT user_id FROM users WHERE name=?";
		
		return query(sql, userName)
		.then(function(results){
			if(results.length === 0){
				throw new Error("can't get user id, user " + userName + "doesn't exists");
			}else{
				return results[0].user_id;
			}
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
		host : 'localhost',
		user : 'root',
		password : '',
		database : 'mechanica_db',
		debug : false
	}),
	
	query : function(queryStr, params){
		var deferred = Q.defer();
		
		module.exports.pool.getConnection(function(err, connection){
			if(err){
				deferred.reject(err);
				//res.status(100).send("error in connection to database");
				return;
			}
			
			//console.log("connected as id " + connection.threadId);
			let q = connection.query(queryStr, params, function(err, results, fields){
				connection.release();
				if(!err){
					//console.log("resolving " + connection.threadId);
					deferred.resolve(results, fields);
				}else{
					deferred.reject(err);
				}
			});
			if(DEBUG_QUERIES)
				console.log("query: " + q.sql);
			
			connection.on('error', function(err){
				//res.status(100).send("error in connection to data base after");
				deferred.reject(err);
			});
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