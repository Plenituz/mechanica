'use strict';
const Q = require('q');
const K3D = require('./K3D.js');
const fs = require('fs');



function run_cmd(cmd, args, callBack ) {
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args);
    var stdout = "";
	var stderr = "";
	var deferred = Q.defer();
	
    child.stdout.on('data', function (data) { 
		stdout += data.toString();
		//console.log(data.toString());
		deferred.notify(data.toString());
	});
	child.stderr.on('data', function(data){
		stderr += data.toString();
		//console.log(data.toString());
	});
	
	child.on('close', function(code){
		/*console.log("stdout=\n");
		console.log(stdout);
		console.log("stderr=\n");
		console.log(stderr);
		console.log("exit code :" + code);*/
		
		// callBack(stdout, stderr, code);
		if(stderr || code !== 0)
			deferred.reject(stdout, stderr, code);
		else
			deferred.resolve(stdout);
	});
	
	return deferred.promise;
} 

function convertToObj(filein, fileout){
	return run_cmd("assimp", ["export", filein, fileout]);
}

function formatJs(vertices, triangles){
	var str = "vertices=[";
	for(var i = 0; i < vertices.length; i++){
		str += vertices[i];
		if(i !== vertices.length-1)
			str += ",";
	}
	str += "];triangles=[";
	for(var i = 0; i < triangles.length; i++){
		str += triangles[i];
		if(i !== triangles.length-1)
			str += ",";
	}
	str += "];";
	return str;
}

module.exports.convertToJs = function(filein){
	return convertToObj(filein, filein + ".obj")
	.then(function(stdout){
		return Q.nfcall(fs.readFile, filein + ".obj");
	})
	.then(function(fileContent){
		var parsed = K3D.parse.fromOBJ(fileContent);
		
		return formatJs(parsed.c_verts, parsed.i_verts);
	})
	.then(function(js){
		return Q.nfcall(fs.writeFile, filein + ".eval", js);
	})
	.then(function(){
		return Q.nfcall(fs.unlink, filein + ".obj");
	})
	.then(function(){
		return Q.nfcall(fs.unlink, filein + ".obj.mtl");//delete the mtl file created with the obj file
	})
	.then(function(){
		return filein + ".eval";
	});
}

module.exports.convertToJs("/media/sf_mechanica/eagle_offset.OBJ")
 .then(function(jspath){
	console.log("conversion successful :" + jspath);
 })
 .fail(function(stdout, stderr, code){
	console.log("error converting (" + code + "):");
	console.log("stderr:" + stderr);
	console.log("stdout:" + stdout);
 });

	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 