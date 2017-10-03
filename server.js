//equivalent of include in C :
const http = require('http');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const hoffman = require('hoffman');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const async = require('async');
//auth
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const MySQLStore = require('express-mysql-session')(session);
//perso
const userRouter = require('./userRouter.js');
const repoRouter = require('./repoRouter.js');
const loginRouter = require('./loginRouter.js');
const db = require('./db.js');
const repoFileRouter = require('./repoFileRouter.js');
const repoManagementRouter = require('./repoManagementRouter.js');
const userManagementRouter = require('./userManagementRouter.js');

require('dotenv').config()
var doCache = process.env.DEBUG == false;

//TODO faire un package.json pour les nodes modules
//quand tu fait npm install faut le faire sur la vm direct
//(bcrypt aime pas etre compilé sur une autre platforme que celle ou il est utilisé)
//j'ai du faire npm install dans un dossier normal de la vm, copier le node_module créé dans sf_mechanica
//le module mmmagic doit etre installer direct depuis la vm
//TODO faire le login client side en javascript pour pas avoir de rafraichissement de page
//TODO faire un vrai certificat de https, et mettre en place renouvellement automatique
//TODO distribuer les fichiers public directement avec nginx : https://www.sitepoint.com/configuring-nginx-ssl-node-js/
//TODO mot de passe oublié
//la fonction createRepo est pas opti
//prevent names and reponame with spaces
//check quand on supprime un repo ca supprime bien tous les elements lié (eg: favorites, messages etc)
//allow only certain type of images as profile pics

const app = express();
app.engine('dust', hoffman.__express());
//set the view engine to dust
app.set('view engine', 'dust');
//indicate to express where the views directory is
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', doCache);
app.enable('trust proxy');

//app.use(function (req, res, next) {
//    console.log(req.method + ":" + req.url);
//    return next();
//}); 

//the order of the middle wares is important
//public files this must be first
app.use(favicon(path.join(__dirname, "public", "imgs", "favicon.ico")));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
	secret : 'efg75zr8g8zregt738z3rz7r4gz35fgs.FSgs$$sfg$sfg$',
	proxy : true,
	resave : false,
	saveUninitialized : false,
	store : new MySQLStore({
		host : 'localhost',
		user : 'root',
		password : '',
		database : 'mechanica_db'
	}),
	cookie: { secure : true } // put true here if we use HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : false }));
//la ligne suivante est obligatoirement apres le bodyParser middleware
app.use(expressValidator());

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
	['dashboard'] : "",
    ['createRepo'] : ""
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

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
//===INIT DB IF NECESSARY===//
//db.initDB();
//for (var i = 0; i < 50; i++)
//    db.createUser(makeid(), "password", makeid() + "@gmail.com");
db.do();
    

//	l'ordre est important ici // Accueil
app.get('/', function(req, res) {
	//render "accueil.dust"(html) using the set render engine (dust)
	if(req.isAuthenticated())
		console.log(req.user, req.user.name);
	res.render('accueil.dust', {req : req});
});

app.get('/dashboard', function(req, res){
	if(req.isAuthenticated()){
		res.redirect('/' + req.user.name);
	}else{
		res.redirect('/login');
	}
})
app.use(repoManagementRouter)
//this is for /login /register /logout
app.use(userManagementRouter);
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
    console.log("end of chain");
	res.writeHead(400, {"Content-Type": "text/html"});
    res.end('<p>404 not found, bitch</p>');
});

var ip = require('ip');
var ipadress = ip.address();
var server = app.listen(3000, "127.0.0.1",
    function () {
        console.log("Server running from " + ipadress + " on port " + server.address().port);
});

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
	  return next();
  res.redirect('/login');
}
