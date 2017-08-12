const express = require('express');
const db = require('./db.js');
const path = require('path');
const Q = require('q');
const fs = require('fs');
const fs_extra = require('fs-extra');
const formidable = require('formidable');

const repoManagementRouter = new express.Router();

repoManagementRouter.post('/createRepo', function (req, res) {
    if (!req.isAuthenticated()) {
        //you can only create repos if you're logged in'
        res.redirect('/login');
        return;
    }

    if (!req.body.reponame) {
        var errStr = encodeURIComponent("the repo title can't be empty");
        res.redirect('/' + req.user.name + '?createRepoError=' + errStr);
        return;
    }

    db.createRepo(req.user.name, req.body.reponame)
        .then(function () {
            res.redirect('/' + req.user.name + '/' + req.body.reponame);
        })
        .fail(function (err) {
            var errStr = encodeURIComponent(err.message);
            res.redirect('/' + req.user.name + '?createRepoError=' + errStr);
        });
});

repoManagementRouter.post('/deleteRepo', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }

    if (!req.body.reponame) {
        console.log("error deleting repo: can't delete empty name repo")
        return;
    }

    db.deleteRepo(req.user.name, req.body.reponame)
        .then(function () {
            res.redirect('/' + req.user.name);
        })
        .fail(function (err) {
            console.log("error deleting repo:" + err);
        })
});

repoManagementRouter.post('/addfav', function (req, res) {
    if (!req.isAuthenticated()) {
        res.status(400).send("not authenticated");
        return;
    }
    db.addToFav(req.user.name, req.body.user, req.body.repo)
        .then(function () {
            res.status(200).send("favorite added");
        })
        .fail(function (err) {
            res.status(400).send("error adding fav: " + err);
            console.log("error adding to fav :" + err);
        });
});

repoManagementRouter.post('/removefav', function (req, res) {
    if (!req.isAuthenticated()) {
        res.status(400).send("not authenticated");
        return;
    }
    db.removeFromFav(req.user.name, req.body.user, req.body.repo)
        .then(function () {
            res.status(200).send("favorite removed");
        })
        .fail(function (err) {
            res.status(400).send("error removing fav:" + err);
            console.log("error removing to fav :" + err);
        });
});

repoManagementRouter.post('/:user/:repo/newVersion', function (req, res) {
    if (!req.isAuthenticated()) {
        res.status(400).send("can't create new version you are not authenticated");
        return;
    }

    var repoId, repoRootLocation, repoNewLocation, repoCurrentVersion;
    db.getRepoLocation(req.user.name, req.params.repo)
        .spread(function (repo_id, repoLocation, current_version) {
            console.log("got repo root location :" + repoLocation);
            repoId = repo_id;
            repoRootLocation = repoLocation;
            repoCurrentVersion = current_version;
            repoNewLocation = path.join(repoRootLocation, "new");

            console.log("checking if " + repoNewLocation + " exists");
            return folderExists(repoNewLocation);
        })
        .then(function (newFolderExists) {
            //create the "new" folder if it's not already their, if it is remove it and recreate it
            if (!newFolderExists) {
                console.log(repoNewLocation + " didn't exist, creating it");
                return Q.nfcall(fs.mkdir, repoNewLocation);
            } else {
                console.log(repoNewLocation + " did exist, deleting and recreating");
                return Q.nfcall(fs_extra.remove, repoNewLocation)
                    .then(function () {
                        console.log(repoNewLocation + " deleted, recreating");
                        return Q.nfcall(fs.mkdir, repoNewLocation);
                    });
            }
        })
        .then(function () {
            //here you are sure to have a "new" folder that is empty
            console.log("new folder should be good");
            return receiveFile(req, repoNewLocation);
        })
        .then(function () {
            console.log("files should be received, renaming current to v" + repoCurrentVersion);
            return renameFile(path.join(repoRootLocation, "current"), path.join(repoRootLocation, "v" + repoCurrentVersion));
            //if this fails then just remove new 
        })
        .catch(function (err) {
            //if this fails you should just remove the new folder
            console.log("error receiving file or renaming current:" + err);

            fs_extra.remove(repoNewLocation, function (err) {
                console.error("error removing new in " + repoRootLocation + ", no big deal");
            });

            return Promise.reject("error receiving file");
        })
        .then(function () {
            console.log("current renamed, renaming new to current");
            return renameFile(repoNewLocation, path.join(repoRootLocation, "current"));
        })
        .catch(function (err) {
            console.log("error renaming new to current, removing new and renaming v" + repoCurrentVersion + " to current");
            return renameFile(path.join(repoRootLocation, "v" + repoCurrentVersion),
                path.join(repoRootLocation, "current"))
                .done(function () {
                    console.log("renamed v to current, removing new");
                    return Q.nfcall(fs_extra.remove, repoNewLocation);
                })
                .fin(function () {
                    //console.log("rejecting");
                    //the log doesn't work but the reject does
                    return Promise.reject(err);
                });
        })
        .then(function () {
            console.log("everything should be good, incrementing version in db");
            return db.incrementVersion(repoId);
        })
        .then(function () {
            res.status(200).send("version updated");
        })
        .fail(function (err) {
            console.log("error updating version on " + req.user.name + "/" + req.params.repo + ": " + err);
            res.status(400).send(err);
        });
});

function renameFile(from, to) {
    let defer = Q.defer();

    fs.rename(from, to, function (err) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve();
        }
    });

    return defer.promise;
}

function receiveFile(req, uploadLocation) {
    let defer = Q.defer();

    let form = new formidable.IncomingForm();
    form.multiples = true;
    form.uploadDir = uploadLocation;

    form.on('file', function (field, file) {
        //when the file is received, rename it 
        fs.rename(file.path, path.join(form.uploadDir, file.name));
    });
    form.on('error', function (err) {
        defer.reject(err);
    });
    form.on('end', function () {
        defer.resolve();
    });
    form.parse(req);

    return defer.promise;
}

//check if a folder exists, not tested for files but should work too
function folderExists(fullPath) {
    let defer = Q.defer();

    fs.access(fullPath, function (err) {
        if (err) {
            defer.resolve(false);
        } else {
            defer.resolve(true);
        }
    });

    return defer.promise;
}

module.exports = repoManagementRouter;
