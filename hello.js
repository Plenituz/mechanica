//equivalent of include in C :
var http = require('http');
var express = require('express');
var path = require('path');
var hoffman = require('hoffman');

var app = express();
//tell express to use EJS render even for html files
//app.engine('html', hoffman.renderFile);
app.engine('dust', hoffman.__express());
//set the view engine to ejs
app.set('view engine', 'dust');
//indicate to express where the views directory is
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', true);

console.log("prep");

app.get('/', function(req, res) {
	console.log("connect /");
	//render "accueil.html" using the set render engine (ejs)
	res.render('accueil.dust')
})
.use(function(req, res, next){
	//in case the user asked for an unset page 
	console.log("connect 404");
	res.writeHead(200, {"Content-Type": "text/html"});
    res.end('<p>404 not found, bitch</p>');
});
//listen on port 80 (http)
app.listen(80);