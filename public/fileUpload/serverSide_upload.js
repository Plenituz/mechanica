const express = require('express');
const path = require('path');
const formidable = require('formidable');
const fs = require('fs');

var app = express();

app.use(express.static(path.join(__dirname)));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/uploadfile', function (req, res) {
    console.log("post to uploadfile");
    let form = new formidable.IncomingForm();
    form.multiples = true;
    form.uploadDir = path.join(__dirname, 'files');

    form.on('file', function (field, file) {
        //everytime a file is uploaded rename it to it's real name
        fs.rename(file.path, path.join(form.uploadDir, file.name));
    });
    form.on('error', function (err) {
        console.log("error on receiving file:" + err);
    });
    form.on('end', function () {
        res.end('success');
    });
    form.parse(req);
});

var server = app.listen(3000, function () {
    console.log('Server listening on port 3000');
})