const express = require('express');
const userRouter = new express.Router();

userRouter.use("/:user", function (req, res) {
	if(req.params.user in userRouter.staticPages){//if this is a static page 
		//get the associated .dust file if any
		let page = userRouter.staticPages[req.params.user];
		
		if(!page){
			//string is null or empty
			//meaning no .dust file provided
			//appending .dust to asked page
			res.render(req.params.user + ".dust");
		}else{
			//a .dust file was provided, rendering it
			res.render(page);
		}
		
	} else {
		if (req.params.user === "waspco") {
			res.status(200).send("sorry this user has been banned")
		} else {
			//check if the use exists before sending
			res.render('userPage.dust', {
				username: req.params.user,
				repos: [
					{ name: "pour l'instant ya pas de db donc on a pas la list" },
					{ name: "pour l'instant ya pas de db donc on a pas la list" },
					{ name: "pour l'instant ya pas de db donc on a pas la list" },
					{ name: "pour l'instant ya pas de db donc on a pas la list" }
				]
			});
		}
		//interogate sql for user data 
	}
});

module.exports = userRouter;