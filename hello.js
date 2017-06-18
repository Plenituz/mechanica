//equivalent of include in C :
const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');
const hoffman = require('hoffman');
var doCache = false;//TODO quand on passe en prod faut changer ca
//TODO faire un package.json pour les nodes modules

const app = express();
app.engine('dust', hoffman.__express());
//set the view engine to dust
app.set('view engine', 'dust');
//indicate to express where the views directory is
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', doCache);

//public files
app.use(express.static(path.join(__dirname, 'public')));

const userRouter = require('./userRouter.js');
const repoRouter = require('./repoRouter.js');
const db = require('./db.js');
const repoFileRouter = require('./repoFileRouter.js');
userRouter.staticPages = {
	['decouvrir'] : "",
	['planDeTravail'] : "",
	['compte'] : "",
	['guide'] : "",
	['login'] : "",
	['signin'] : ""
};

//===INIT DB IF NECESSARY===//
db.initDB();

app.get('/testdb', function(req, res){
	db.query("SELECT * FROM table1 WHERE id=? OR id=?", [1, 2], function(err){
		console.log("error " + err);
		res.status(100).send("error in db " + err);
	}, function(results, fields){
		res.json(results);
	});
});

//l'ordre est important ici
app.get('/', function(req, res) {
	//render "accueil.dust"(html) using the set render engine (dust)
	res.render('accueil.dust', {isConnected:false})
})
//this is for '/:user/:repo/:file'
.use(repoFileRouter)
//this is for '/:user/:repo'
.use(repoRouter)
//this has to be after the static, all non hard coded url end up here
//this is for '/:user'
.use(userRouter)

.use(function(req, res, next){
	//in case the user asked for an unset page
	res.writeHead(200, {"Content-Type": "text/html"});
    res.end('<p>404 not found, bitch</p>');
});

    var server = app.listen(3000, "127.0.0.1",
        function () {
            console.log("server running at " + server.address().address + " on port " + server.address().port);
        });
