var fileToLoad = "EAGLE_offset.obj.eval";

function getFileFromServer(url, doneCallback) {
		var xhr;

		xhr = new XMLHttpRequest();
		xhr.onreadystatechange = handleStateChange;
		xhr.open("GET", url, true);
		xhr.send();

		function handleStateChange() {
			if (xhr.readyState === 4) {
				doneCallback(xhr.status == 200 ? xhr.responseText : null);
			}
		}
	}

window.onload = function(){
	getFileFromServer(fileToLoad, function(text){
			if(text === null){
				console.log("an error occured while loading file " + fileToLoad);
			}else{
				//console.log(text);
				eval(text);
				//console.log("verts:" + vertices.length);
				//console.log("tris:" + triangles.length);
				webGLStart();
			}
		});
	
	
}