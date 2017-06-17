var mysql = require('mysql');
var express = require("express");

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
				location TINYTEXT NOT NULL,
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
			
			"ALTER TABLE discussions ADD CONSTRAINT fk_discussion_creator_id FOREIGN KEY (creator_id)"
				+ " REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE",
				
			"ALTER TABLE discussions ADD CONSTRAINT fk_discussion_hosting_repo FOREIGN KEY (hosting_repo)" 
				+ " REFERENCES repos (repo_id) ON DELETE CASCADE ON UPDATE CASCADE;",
				
			"ALTER TABLE discussion_messages ADD CONSTRAINT fk_discussion_messages_creator_id FOREIGN KEY (creator_id)"
				+ " REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE;",
				
			"ALTER TABLE discussion_messages ADD CONSTRAINT fk_discussion_messages_hosting_discussion FOREIGN KEY (hosting_discussion)" 
				+ "REFERENCES discussions (discussion_id) ON DELETE CASCADE ON UPDATE CASCADE;"	
		];	
		
		console.log("creating db");
	
	
		let query = module.exports.query;
		let error = function(err){
			console.log("error while creating tables :" + err);
		};
		let currentId = 0;
		let func = function(results, fields){
			if(currentId < instructions.length-1){
				//call yourself with the next instruction until there is no longer instructions
				currentId++;
				query(instructions[currentId], null, error, func);
			}else{
				console.log("done creating db");
			}
		}
		
		query(instructions[0], null, error, func);
	},
	
	pool : mysql.createPool({
		host : 'localhost',
		user : 'root',
		password : '',
		database : 'mechanica_db',
		debug : false
	}),
	
	query : function(queryStr, params, onErr, onResult){
		module.exports.pool.getConnection(function(err, connection){
			if(err && onErr){
				onErr(err);
				//res.status(100).send("error in connection to database");
				return;
			}
			
			//console.log("connected as id " + connection.threadId);
			let q = connection.query(queryStr, params, function(err, results, fields){
				connection.release();
				if(!err){
					if(onResult)
						onResult(results, fields);
				}else if(onErr){
					//res.status(100).send("error in query " + err);
					onErr(err);
				}
			});
			//console.log(q.sql);
			
			connection.on('error', function(err){
				//res.status(100).send("error in connection to data base after");
				if(onErr)
					onErr(err);
			});
		});
	}
}