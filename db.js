const mysql = require('mysql');
const Q = require('q');

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
		//let query = module.exports.query;
		//let q = "INSERT INTO users VALUES(NULL, ?, ?, ?, NOW(), NULL)";
		
		
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
			
			console.log("connected as id " + connection.threadId);
			let q = connection.query(queryStr, params, function(err, results, fields){
				connection.release();
				if(!err){
					console.log("resolving " + connection.threadId);
					deferred.resolve(results, fields);
				}else{
					deferred.reject(err);
				}
			});
			//console.log(q.sql);
			
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
		let query = module.exports.query;
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