const express = require('express');
const db = require('./db.js');
const fs = require('fs');
const Q = require('q');
const path = require('path');
const repoRouter = new express.Router();


repoRouter.get('/:user/:repo', function (req, res, next) {
    if ("discussionList" in req.query) {

		db.getRecentDiscussions(req.params.user, req.params.repo, 10)
		    .then(function(discussionList){
			    res.render('discussionList.dust', { req: req, discussionList : discussionList});
		    })
		    .fail(function(err){
			    res.render('discussionList.dust', {req : req, error : err});
            });

    } else if ("discussion_id" in req.query) {

		db.getRecentMessagesInDiscussion(req.params.user, req.params.repo, req.query.discussion_id, 10)
            .then(function (msgList) {
			    res.render('discussionContent.dust', {req : req, msgList : msgList});
		    })
		    .fail(function(err){
			    res.render('discussionContent.dust', {req : req, error : err});
            });

    } else {
        var fileList;
		db.getRepoLocation(req.params.user, req.params.repo)
            .spread(function (repo_id, location) {
	            let currentVersion = path.join(location, "current");
			
	            return Q.nfcall(fs.readdir, currentVersion);
            })
            .then(function (files) {
                fileList = files;
                if (req.isAuthenticated())
                    return db.isRepoFav(req.user.name, req.params.user, req.params.repo);
                else
                    return false;
            })
            .then(function (isFav) {
                //only give isFav if isFav is true, due to how the dust is made
                let obj = {
                    req: req,
                    files: fileList
                };
                if (isFav)
                    obj.isFav = true;

                res.render('repoPage.dust', obj);
            })
            .fail(function(err){
	            console.log("error on repo page :" +err);
	            next();
            });

	}
});

//post handles the discussion creation
repoRouter.post('/:user/:repo', function(req, res, next){

	if(req.isAuthenticated() && ("discussion_id" in req.query) 
		&& ("repoAdminName" in req.query) && ("repoName" in req.query) && ("content" in req.body)){
		//this asks for a specific discussion

		db.createMessageInDiscussion(req.body.content, req.user.name, 
			req.query.repoAdminName, req.query.repoName, req.query.discussion_id)
		    .then(function(){
			    req.method = "GET";
			    res.redirect("/" + req.params.user + "/" + req.params.repo + "?discussion_id=" + req.query.discussion_id);
		    })
		    .fail(function(err){
			    res.render('discussionContent.dust', {req : req, error:err.toString()});
		    });
	}else if(req.isAuthenticated() && ("repoAdminName" in req.query)
		 && ("repoName" in req.query) && ("title" in req.body) && ("firstMessage" in req.body)){
		//this asks for the discussion list for a repo
		
		var discId;
		db.createDiscussion(req.query.repoAdminName, req.query.repoName, req.body.title, req.user.name)
		    .then(function(discussion_id){
			    discId = discussion_id;
			    return db.createMessageInDiscussion(req.body.firstMessage, req.user.name, req.params.user, req.params.repo, discussion_id);
		    })
		    .then(function(){
			    req.method = "GET";
			    res.redirect("/" + req.params.user + "/" + req.params.repo + "?discussion_id=" + discId);
		    })
		    .fail(function(err){
			    res.render('discussionList.dust', {req: req, error : err.toString()});
		    });
	}else{
		return next();
	}
});

module.exports = repoRouter;
