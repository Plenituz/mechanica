const express = require('express');
const loginRouter = new express.Router();
const db = require('./db.js');
const registerPage = "register.dust";//"register.dust";
const loginPage = "login.dust";

//All about register

loginRouter.get('/register', function(req, res){
	if(req.isAuthenticated()){
		res.redirect('/');
	}else{
		res.render(registerPage, {req : req});
	}
});

loginRouter.post('/register', function(req, res){
	var redirectUrl = req.query.redirect || "/" + req.body.username;

	if(req.isAuthenticated()){
		console.log("can't signin user, already authenticated");
		res.redirect(redirectUrl);
		return;
	}

	req.sanitizeBody('username').trim();
	req.sanitizeBody('email').trim();
	req.checkBody('username', "Le nom d'utilisateur ne peut être vide").notEmpty();
	req.checkBody('username', "Le nom d'utilisateur doit comprendre entre 4 et 32 caractères").len(1, 32);
	req.checkBody('email', "L'adresse email est invalide").isEmail();
	req.checkBody('email', "L'adresse email doit comprendre entre 4 et 256 caractères").len(4, 128);
	req.checkBody('password', "Le mot de passe doit comprendre entre 8 et 64 caractères").len(8, 64);
	req.checkBody('password_conf', 'Les mots de passe ne correspondent pas').equals(req.body.password);

	let handleError = function(err){
		res.render(registerPage, {
				req : req,
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
				res.redirect(redirectUrl);
			}
		});

	})
	.fail(function(err){
		console.log("error creating user:" + err);
		handleError({ msg : err.message});
	});
	//console.log(req.body.username + ";" + req.body.email + ";" + req.body.password + ";" + req.body.password_conf);
});

//All about login

loginRouter.get('/login', function(req, res){
	if(req.isAuthenticated()){
		res.redirect('/');
	}else{
		res.render(loginPage, {req : req});
	}
});

loginRouter.post('/login', function(req, res){
	var redirectUrl = req.query.redirect || "/";

	if(req.isAuthenticated()){
		console.log("user already authenticated");
		res.redirect(redirectUrl);
		return;
	}

	let handleError = function(err){
		res.render(loginPage, {
						req : req,
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
				console.log("logged in: " + redirectUrl + "," + req.query.redirect);
				res.redirect(redirectUrl);
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
