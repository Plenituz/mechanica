/*
// Concat and minify this shit
*/
var FILE_ENCODING = 'utf-8',

EOL = '\n';

var _fs = require('fs');
var uglify = require("uglify-js");

function concat(opts) {
	_fs.writeFileSync(distPath, out.join(EOL), FILE_ENCODING);
	console.log(' '+ distPath +' built.');
}

/*
concat({
	src : filesArray.configs.templates.dev,
	dest : 'dist/templates.html'
});

concat({
	src : filesArray.configs.app.dev,
	dest : 'dist/appfiles.js'
});

function uglify(srcPath, distPath) {
	 var
		uglyfyJS = require('uglify-js'),
		jsp = uglyfyJS.parser,
		pro = uglyfyJS.uglify,
		ast = jsp.parse( _fs.readFileSync(srcPath, FILE_ENCODING) );

	 ast = pro.ast_mangle(ast);
	 ast = pro.ast_squeeze(ast);

	 _fs.writeFileSync(distPath, pro.gen_code(ast), FILE_ENCODING);
	 console.log(' '+ distPath +' built.');
}*/

uglify('dist/appfiles.js', 'dist/appfiles.min.js');

console.log("and you're done");
process.exit(1);
