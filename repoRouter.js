const express = require('express');
const db = require('./db.js');
const fs = require('fs');
const Q = require('q');
const path = require('path');
const repoRouter = new express.Router();

repoRouter.get('/:user/:repo', function (req, res, next) {
	db.getRepoLocation(req.params.user, req.params.repo)
	.spread(function(repo_id, location){
		let currentVersion = path.join(location, "current");
		
		return Q.nfcall(fs.readdir, currentVersion);
	})
	.then(function(files){
		res.render('repoPage.dust', {
			req : req,
			files: files
		});
	})
	.fail(function(err){
		console.log("error on repo page :" +err);
		next();
	});
});

module.exports = repoRouter;
