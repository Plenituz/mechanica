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

///
///this is probably the dirtiest piece of code I have ever written
///

repoManagementRouter.post('/:user/:repo/newVersion', function (req, res) {
    return;
    if (!req.isAuthenticated()) {
        return next();
    }
    console.warn("post newversion");

    var repoId, rootLocation, newlocation, currentVersion;

    let handleError = function (err) {
        console.warn("error:" + err);

        fs_extra.remove(newlocation, function (err) {
            if (err) {
                console.warn("error while clening up error, couldn't delete " + newlocation);
            }
            console.warn("sending 400");
            res.status(400).send("");
        });
    }
    return;
    db.getRepoLocation(req.user.name, req.params.repo)
        .spread(function (repo_id, repoLocation, current_version) {
            repoId = repo_id;
            currentVersion = current_version;
            rootLocation = repoLocation;
            newlocation = path.join(repoLocation, "new");

            let defer = Q.defer();

            fs.stat(newlocation, function (err, stats) {
                if (err) {
                    defer.resolve(true);
                } else {
                    defer.resolve(false);
                }
            });

            return defer.promise;
        })
        .then(function (shouldCreate) {
            if (shouldCreate) {
                console.warn("creating new dir");
                return Q.nfcall(fs.mkdir, newlocation);
            }
        })
        .then(function () {
            let defer = Q.defer();

            let form = new formidable.IncomingForm();
            form.multiples = true;
            form.uploadDir = newlocation;

            form.on('file', function (field, file) {
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
        })
        .then(function () {
            //succefully uploaded files
            //increment the current version
            //rename current to the old version
            //and rename new to current
            //dans cet ordre sp�cifique pour le error handling
            console.warn("incrementing");
            return db.incrementVersion(repoId);
        })
        .then(function () {
            //rename current to vX X being the currentVersion-1 (since we just incremented it)
            console.warn("renaming current to v");
            return Q.nfcall(fs.rename, path.join(rootLocation, "current"), path.join(rootLocation, "v" + currentVersion));
        })
        .then(function () {
            console.warn("to the end");
            fs.rename(newlocation, path.join(rootLocation, "current"), function (err) {
                console.warn("rename callback");
                if (err) {
                    console.warn("something went wrong while renaming new to current, reversing the last version to current in " + rootLocation + ":");
                    console.warn(err);

                    //try to rename the vX folder back to current
                    fs.rename(path.join(rootLocation, "v" + currentVersion), path.join(rootLocation, "current"), function (err) {
                        if (err) {
                            console.warn("something went HORRIBLY WRONG, could'nt recover from not being able to rename new to current in " + rootLocation + ":");
                            console.warn(err);
                            throw new Error("something horrible happened");
                        } else {
                            throw new Error("their was an error on our server, sorry !");
                        }
                    });
                } else {
                    res.status(200).send("");
                }
            });
        })
        .fail(handleError)
        .fin(() => { console.log("end of callalala");})
});

module.exports = repoManagementRouter;
