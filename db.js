var mysql = require('mysql');
var express = require("express");

module.exports.pool = mysql.createPool({
		host : 'localhost',
		user : 'root',
		password : '',
		database : 'mechanica_db',
		debug : false
	});

module.exports.query = function(queryStr, params, onErr, onResult){
	module.exports.pool.getConnection(function(err, connection){
		if(err && onErr){
			onErr(err);
			//res.status(100).send("error in connection to database");
			return;
		}
		
		//console.log("connected as id " + connection.threadId);
		
		let q = connection.query(queryStr, params, function(err, results, fields){
			connection.release();
			console.log("result");
			if(!err){
				if(onResult)
					onResult(results, fields);
			}else if(onErr){
				//res.status(100).send("error in query " + err);
				onErr(err);
			}
		});
		console.log(q.sql);
		
		connection.on('error', function(err){
			//res.status(100).send("error in connection to data base after");
			connection.release();
			if(onErr)
				onErr(err);
		});
	});
}