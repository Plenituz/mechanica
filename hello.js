//equivalent of include in C :
const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');
const hoffman = require('hoffman');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
//auth
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const duster = require('duster');	// ???????????????????????????
var doCache = false;//TODO quand on passe en prod faut changer ca
//TODO faire un package.json pour les nodes modules
//TODO quand tu fait npm install faut le faire sur la vm direct 
//(bcrypt aime pas etre compilé sur une autre platforme que celle ou il est utilisé)
//j'ai du faire npm install dans un dossier normal de la vm, copier le node_module créé dans sf_mechanica
//TODO install serve-favicon and user it, because right now everytime you request a page 
//the system thinks "favicon.ico" is an user and query the db to check if it exists
//https://stackoverflow.com/questions/15463199/how-to-set-custom-favicon-in-express
//TODO faire le login client side en javascript pour pas avoir de rafraichissement de page

const app = express();
app.engine('dust', hoffman.__express());
//set the view engine to dust
app.set('view engine', 'dust');
//indicate to express where the views directory is
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', doCache);

//the order of the middle wares is important
//public files this must be first
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
	secret : 'efg75zr8g8zregt738z3rz7r4gz35fgs.FSgs$$sfg$sfg$',
	resave : false,
	saveUninitialized : false,
	//cookie: { secure : true } TODO put true here if we use HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : false }));
//la ligne suivante est obligatoirement apres le bodyParser middleware
app.use(expressValidator());



const userRouter = require('./userRouter.js');
const repoRouter = require('./repoRouter.js');
const loginRouter = require('./loginRouter.js');
const db = require('./db.js');
const repoFileRouter = require('./repoFileRouter.js');

// CSS files rendering
// We get one big one out of many small
/*duster.watch(["views", "../views"], "js/templates.js", {}, function (err, results) {
	    console.log("Templates updated at", new Date().toLocaleTimeString());
});*/
//var compiled_css = res.render('compiled.css','main.dust');

// Static page rooter
userRouter.staticPages = {
	['decouvrir'] : "",
	['compte'] : "",
	['guide'] : "",
};
//list below the hardcoded url that are not in staticPages above
//it prevent users from creating an account with that name
loginRouter.forbidenNames = Object.assign({}, userRouter.staticPages, {
	['login'] : "",
	['logout'] : "",
	['register'] : "",
	['dashboard'] : ""
});

passport.serializeUser(function(user_id, done){
	db.getUserInfo(user_id)
	.spread(function(name, email){
		var userSession = { 
			user_id : user_id, 
			name : name,
			email : email
		};
		done(null, userSession);
	});
});

passport.deserializeUser(function(userSession, done){
	done(null, userSession);
});

//===INIT DB IF NECESSARY===//
//db.initDB();
 /*db.createRepo("user", "testrepo")
.fail(function(err){
	console.log("error creating repo:" + err);
});
db.createRepo("user", "testrepo2")
.fail(function(err){
	cosole.log("error creating repo:" + err);
});*/


//	l'ordre est important ici // Accueil
app.get('/', function(req, res) {
	console.log("user:" + req.user +";" + req.isAuthenticated());
	
	//render "accueil.dust"(html) using the set render engine (dust)
	res.render('accueil.dust', {req : req});
});
app.get('/dashboard', function(req, res){
	if(req.isAuthenticated()){
		res.redirect('/' + req.user.name);
	}else{
		res.redirect('/');
	}
})
//this is for /login /register /logout
app.use(loginRouter);
//this has to be after the static, all non hard coded url end up here
//this is for '/:user/:repo/:file'
app.use(repoFileRouter);
//this is for '/:user/:repo'
app.use(repoRouter);
//this is for '/:user'
app.use(userRouter);

app.use(function(req, res, next){
	//in case the user asked for an unset page
	res.writeHead(200, {"Content-Type": "text/html"});
    res.end('<p>404 not found, bitch</p>');
});

var server = app.listen(3000, "127.0.0.1",
    function () {
        console.log("server running at " + server.address().address + " on port " + server.address().port);
});

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
	  return next(); 
  res.redirect('/login');
}
