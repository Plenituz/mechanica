const express = require('express');
const repoRouter = new express.Router();

repoRouter.use('/:user/:repo', function (req, res) {
    res.render('repoPage.dust', {
        reponame: req.params.repo,
        username: req.params.user,
        files: [
            { name: "tjrs rien ici" },
            { name: "tjrs rien ici" },
            { name: "tjrs rien ici" },
            { name: "tjrs rien ici" }
        ]
    });
});

module.exports = repoRouter;