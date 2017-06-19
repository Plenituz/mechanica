const express = require('express');
const repoRouter = new express.Router();

repoRouter.use('/:user/:repo', function (req, res) {
    res.render('repoPage.dust', {
        reponame: req.params.repo,
        username: req.params.user,
        files: [    // Une fonction doit nous fournir une liste des x (6 est bien) derniers repos.
            { id_1: "tjrs rien ici" },
            { id_2: "tjrs rien ici" },
            { id_3: "tjrs rien ici" },
            { id_4: "tjrs rien ici" }
        ]
    });
});

module.exports = repoRouter;
