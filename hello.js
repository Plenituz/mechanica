//equivalent of include in C :
var http = require('http');
var express = require('express');
var path = require('path');
var fs = require('fs');
var hoffman = require('hoffman');
var defaultImgPath = path.join(__dirname, 'public', 'imgs', 'default.png');
var doCache = false;//TODO quand on passe en prod faut changer ca

var app = express();
//tell express to use EJS render even for html files
//app.engine('html', hoffman.renderFile);
app.engine('dust', hoffman.__express());
//set the view engine to ejs
app.set('view engine', 'dust');
//indicate to express where the views directory is
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', doCache);

displayIP();
console.log("server started on port 3000");

app.get('/', function(req, res) {
	//render "accueil.dust"(html) using the set render engine (dust)
	res.render('accueil.dust', { names : [{caca : "bob"}, {caca:"billy"}] })
})
//image files
.get('/imgs/:file', function(req, res){
	//create a path to /public/imgs/:file
	var fPath = path.join(__dirname, 'public', 'imgs',
		path.basename(req.params.file) );
	//check if the file exist, if it does serve it otherwise yell
	if(fs.existsSync(fPath)){
		res.sendFile(fPath);
    } else {
        res.sendFile(defaultImgPath);
	}
})
.use(express.static(path.join(__dirname, 'public')))
.use(function(req, res, next){
	//in case the user asked for an unset page 
	res.writeHead(200, {"Content-Type": "text/html"});
    res.end('<p>404 not found, bitch</p>');
});

app.listen(3000, "127.0.0.1");


function displayIP() {
    var os = require('os');
    var ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;
        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                return;
            }
            if (alias >= 1)
                console.log(ifname + ":" + alias, iface.address);
            else
                console.log(ifname, iface.address);
            alias++;
        });
    });
}