const express = require('express');
const loginRouter = new express.Router();
const db = require('./db.js');

loginRouter.get('/register', function(req, res){
	if(req.isAuthenticated()){
		res.redirect('/');
	}else{
		res.render('testlogin/testLogin_register.dust');
	}
});

loginRouter.post('/register', function(req, res){
	if(req.isAuthenticated()){
		console.log("can't signin user, already authenticated");
		res.redirect('/');
		return;
	}
	
	req.sanitizeBody('username').trim();
	req.sanitizeBody('email').trim();
	req.checkBody('username', 'Username cannot be empty').notEmpty();
	req.checkBody('username', 'Username must be between 1-20 characters').len(1, 20);
	req.checkBody('email', 'The email provided is invalid').isEmail();
	req.checkBody('email', "Email address must be between 4-254 characters").len(4, 254);
	req.checkBody('password', 'Password must be between 8-100 characters').len(8, 100);
	req.checkBody('password_conf', 'passwords do no match').equals(req.body.password);
	
	let handleError = function(err){
		res.render('testlogin/testLogin_register.dust', {
				error : err, 
				username:req.body.username,
				email:req.body.email
			});
	};
	
	var checkErrors = req.validationErrors();
	if(checkErrors){
		//send error message to page 
		handleError(checkErrors);
		return;
	}
	
	if(req.body.username in loginRouter.forbidenNames){
		handleError({msg: "Your user name can't be " + req.body.username + " sorry :/"});
		return;
	}
	
	db.createUser(req.body.username, req.body.password, req.body.email)
	.then(function(user_id){
		
		req.login(user_id, function(err){
			if(err){
				console.log("error login in: " + err);
				handleError({msg : "Error while loggin in"});
			}else{
				res.redirect('/');
			}
		});
		
	})
	.fail(function(err){
		console.log("error creating user:" + err);
		handleError({ msg : err.message});
	});
	//console.log(req.body.username + ";" + req.body.email + ";" + req.body.password + ";" + req.body.password_conf);
});

loginRouter.get('/login', function(req, res){
	if(req.isAuthenticated()){
		res.redirect('/');
	}else{
		res.render('testlogin/testLogin_login.dust');
	}
});

loginRouter.post('/login', function(req, res){
	if(req.isAuthenticated()){
		console.log("user already authenticated");
		res.redirect('/');
		return;
	}
	
	let handleError = function(err){
		res.render('testlogin/testLogin_login.dust', {
						error : {msg : err.message},
						username : usernameOrEmail
					});
	}
	
	var usernameOrEmail = req.body.username;
	var password = req.body.password;
	
	db.canAuthenticateUser(usernameOrEmail, password)
	.then(function(user_id){
		req.login(user_id, function(err){
			if(err){
				handleError(err);
			}else{
				res.redirect('/');
			}
		});
	})
	.fail(function(err){
		console.log("error checking db:" + err);
		handleError(err);
	});
});

loginRouter.get('/logout', function(req, res){
	req.session.destroy(function(err){
		if(err){
			console.log("error while logout");
		}
		res.redirect('/');
	});
});

module.exports = loginRouter;