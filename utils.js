const fs = require('fs');
const Q = require('q');
const formidable = require('formidable');
const path = require('path');

module.exports = {
    receiveFile: function (req, uploadLocation, rename) {
        if (!rename)
            rename = false;
        let defer = Q.defer();
        var paths = [];

        let form = new formidable.IncomingForm();
        form.multiples = true;
        form.uploadDir = uploadLocation;

        form.on('file', function (field, file) {
            //when the file is received, rename it 
            
            if (rename) {
                fs.rename(file.path, path.join(form.uploadDir, file.name));
                paths.push(path.join(form.uploadDir, file.name));
            } else {
                paths.push(file.path);
            }
        });
        form.on('error', function (err) {
            defer.reject(err);
        });
        form.on('end', function () {
            defer.resolve(paths);
        });
        form.parse(req);
        return defer.promise;
    }
};
