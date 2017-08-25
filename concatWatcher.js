//File & Dir watcher // For css concat on the fly
//Watcher parameter
const chokidar = require('chokidar');
const fs = require('fs');
const Q = require('q');
const concat = require('concat-files');
const path = require('path');

var pathConcat = path.join('public', 'css');
var watcher = chokidar.watch(pathConcat,
    {
        ignored: /(^|[\/\\])\../[pathConcat + 'concat.css'],
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: true,
        usePolling: true,
        interval: 100,
        binaryInterval: 100
    }
);

watcher //Watcher events
    .on('ready', () => console.log('Initial scan complete. Chokidar ready for changes'))
    .on('change', goconcat);

//*/ delete the first slash to switch version of goconcat
function goconcat() {
    console.log('Css files have been modified. New concat ...');
    fs.unlink(path.join(pathConcat, 'concat.css'), function (err) {
        if (err) throw err;
        fs.readdir(pathConcat, function (err, files) {
            if (err) throw err;
            var list = files.map(function (files) {
                return path.join(pathConcat, files);
            });
            setTimeout(function () {
                concat(list, path.join(pathConcat, 'concat.css'), function (err) {
                    if (err) throw err;
                })
            }, 100);
        });
    });
}
/*/
function goconcat() {
    console.log("css files have been modified. New concat ...");
    //delete concat.css
    Q.nfcall(fs.unlink, path.join(pathConcat, 'concat.css'))
        //err happen if the concat.css didn't exist
        .catch((err) => console.log("no concat.css to delete, concating none the less :" + err))
        //read dir content
        .then(() => Q.nfcall(fs.readdir, pathConcat))
        //compact file list
        .then(function applyConcat(files) {
            var list = files.map((file) => path.join(pathConcat, file));
            return Q.delay(list, 100);
        })
        //do the concat
        .then((list) => Q.nfcall(concat, list, path.join(pathConcat, 'concat.css')))
        .then(() => console.log("concat done"))
        //on error
        .fail((err) => console.log("error while doing concat: " + err));
}
/*/