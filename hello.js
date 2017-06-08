//equivalent of include in C :
var http = require('http');
var express = require('express');
var path = require('path');
var fs = require('fs');
var hoffman = require('hoffman');
var doCache = false;//TODO quand on passe en prod faut changer ca

var app = express();
app.engine('dust', hoffman.__express());
//set the view engine to dust
app.set('view engine', 'dust');
//indicate to express where the views directory is
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', doCache);


    app.get('/', function(req, res) {
	    //render "accueil.dust"(html) using the set render engine (dust)
	    res.render('accueil.dust')
    })
        //exemple dustjs
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
    //public files
    .use(express.static(path.join(__dirname, 'public')))
    .use(function(req, res, next){
	    //in case the user asked for an unset page
	    res.writeHead(200, {"Content-Type": "text/html"});
        res.end('<p>404 not found, bitch</p>');
    });

    var server = app.listen(3000, "127.0.0.1",
        function () {
            console.log("server running at " + server.address().address + " on port " + server.address().port);
        });