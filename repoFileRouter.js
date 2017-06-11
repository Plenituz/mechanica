const express = require('express');
const repoFileRouter = new express.Router();

repoFileRouter.use('/:user/:repo/:file', function (req, res) {
    res.render('fileDisplay.dust', {
        filename: req.params.file,
        reponame: req.params.repo,
        username: req.params.user
    });
});

module.exports = repoFileRouter;