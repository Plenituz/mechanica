const express = require('express');
const repoFileRouter = new express.Router();

repoFileRouter.get('/:user/:repo/:file', function (req, res) {
    res.render('fileDisplay.dust', {
        req : req
    });
});

module.exports = repoFileRouter;