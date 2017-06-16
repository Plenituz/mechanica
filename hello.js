//equivalent of include in C :
const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');
const hoffman = require('hoffman');
var doCache = false;//TODO quand on passe en prod faut changer ca

const app = express();
app.engine('dust', hoffman.__express());
//set the view engine to dust
app.set('view engine', 'dust');
//indicate to express where the views directory is
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', doCache);

//public files
app.use(express.static(path.join(__dirname, 'public')))

const userRouter = require('./userRouter.js');
const repoRouter = require('./repoRouter.js');
const repoFileRouter = require('./repoFileRouter.js');

//exemple dustjs
/*
.get('/exemple', function (req, res) {
    res.render('exemple.dust', {
        listTest: [
            { name: "Bob", age: 21 },
            { name: "Harry", age: 34 },
            { name: "John", age: 65 }
        ],
        listOfWhat : "type sympatique"
    });
})
.get('/three', function (req, res) {
    res.sendFile(path.join(__dirname, "views", "threeTest.html"));
})*/

// Rendu des différentes pages
app.get('/', function(req, res) {
	//render "accueil.dust"(html) using the set render engine (dust)
	res.render('accueil.dust')
})

.get('/decouvrir', function (req, res) {
	res.render('decouvrir.dust')
})

.get('/plandetravail', function (req, res) {
	res.render('planDeTravail.dust')
})

.get('/guide', function (req, res) {
	res.render('guide.dust')
})

.get('/compte', function (req, res) {
	res.render('compte.dust')
})


//l'ordre est important ici

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
