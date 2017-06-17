var fileToLoad = "data.txt";

window.onload = function(){
	/*K3D.load("e.obj", function(data){
		var parsed = K3D.parse.fromOBJ(data);
		console.log(parsed);
		vertices = parsed.c_verts;
		triangles = parsed.i_verts;
		webGLStart();
	});*/
	getFileFromServer(fileToLoad, function(text){
			if(text === null){
				console.log("an error occured while loading file " + fileToLoad);
			}else{
				//console.log(text);
				eval(text);
				console.log("verts:" + vertices.length);
				console.log("tris:" + triangles.length);
				webGLStart();
			}
		});
	
	
}