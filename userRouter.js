const express = require('express');
const db = require('./db.js');
const userRouter = new express.Router();

userRouter.get("/:user", function (req, res, next) {
	if(req.params.user in userRouter.staticPages){//if this is a static page 
		//get the associated .dust file if any
		let page = userRouter.staticPages[req.params.user];
		
		if(!page){
			//string is null or empty
			//meaning no .dust file provided
			//appending .dust to asked page
			res.render(req.params.user + ".dust", {req : req});
		}else{
			//a .dust file was provided, rendering it
			res.render(page, {req : req});
		}
		
	} else {
        var repoList, favRepos;
		//check if the user exists before sending
		db.doesUserExists(req.params.user)
	        .then(function(exists){
		        if(exists){
			        return db.getRecentRepos(req.params.user, 6);
		        }else{
			        throw new Error("user " + req.params.user + " doesn't exist");
		        }
	        })
            .then(function (repo_list) {
                repoList = repo_list;
                return db.getFavoriteRepos(req.params.user, 4);
            })
            .then(function (favRepoList) {
                favRepos = favRepoList;
                return db.getAllUserInfo(req.params.user);
            })
            .then(function (userInfo) {
                res.render('userPage.dust', {
                    req: req,
                    repos: repoList,
                    favRepos: favRepos,
                    userInfo: userInfo
                });
            })
	        .fail(function(err){
		        console.log("error serving user page :" + err);
		        next();//go to 404 page
	        });
			
	}
});

module.exports = userRouter;