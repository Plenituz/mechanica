const express = require('express');
const utils = require('./utils.js');
const mmmagic = require('mmmagic');
const Magic = mmmagic.Magic;
const Q = require('q');
const fs = require('fs');
const db = require('./db.js');
const path = require('path');

const userManagementRouter = new express.Router();

userManagementRouter.post('/setProfilePic', function (req, res) {
    if (!req.isAuthenticated()) {
        res.status(400).send("you need to be authenticated to do that");
        return;
    }
   // console.log("receiving file");
    //set the avatar
    var tmpFilePath = path.join(__dirname, "public", "imgs", "profile");
    utils.receiveFile(req, tmpFilePath)
        .then(function (filePaths) {
            if (filePaths.length > 1) {
                //make sure only one file is uploaded
                for (var i = 0; i < filePaths.length; i++) {
                    fs.unlink(filePaths[i], function (err) {
                        console.log("error deleting wrong profile pic at:" + filePaths[i]);
                    });
                }

                throw new Error("only one file can be sent as a profile picture")
            }
            //console.log("file received, detecting type");
            tmpFilePath = filePaths[0];
            return detectFileType(tmpFilePath);
        })
        .then(function (fileType) {
            //console.log("type is:" + fileType);
            //fileType is "image/png" for example
            var split = fileType.split("/");
            var categorie = split[0];
            if (categorie == "image") {
                //accept all type of images for now
                //file is an image, rename _new to real user name and update the db 
                //console.log("renaming file");
                var finalFilePath = path.join(__dirname, "public", "imgs", "profile", req.user.name);
                return Q.nfcall(fs.rename, tmpFilePath, finalFilePath)
                    .then(function () {
                        //console.log("updating db");
                        return db.setProfilePicturePath(req.user.name, "/imgs/profile/" + req.user.name);
                    })
                    .then(function () {
                        //console.log("sending ok");
                        res.status(200).send("all good, profile pic set");
                    });
            } else {
                //console.log("bad type, sending bad and deleting");
                //not an image, delete the file and return error
                res.status(400).send("file must be an image");
                return Q.nfcall(fs.unlink, tmpFilePath);
            }
        })
        .fail(function (err) {
            //console.log("error uploading profile pic:" + err);
            res.status(400).send("internal error, try again later, sorry!");
        });
    
});

function detectFileType(filePath) {
    var defer = Q.defer();

    var magic = new Magic(mmmagic.MAGIC_MIME_TYPE);
    magic.detectFile(filePath, function (err, result) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(result);
        }
    });

    return defer.promise;
}

module.exports = userManagementRouter;
