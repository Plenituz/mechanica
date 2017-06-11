const express = require('express');
const userRouter = new express.Router();

userRouter.use("/:user", function (req, res) {
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
});

module.exports = userRouter;