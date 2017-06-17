'use strict';

function run_cmd(cmd, args, callBack ) {
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args);
    var stdout = "";
	var stderr = "";
	
    child.stdout.on('data', function (data) { 
		stdout += data.toString();
		console.log(data.toString());
	});
	child.stderr.on('data', function(data){
		stderr += data.toString();
		console.log(data.toString());
	});
	
	child.on('close', function(code){
		/*console.log("stdout=\n");
		console.log(stdout);
		console.log("stderr=\n");
		console.log(stderr);
		console.log("exit code :" + code);*/
		callBack(stdout, stderr, code);
	});
	
	
	
} 

function convertToObj(filein, fileout, onErr){
	//const scriptLoc = "D:\\_CODING\\wedev\\mechanica\\public\\fileconvert\\script.py";
	const scriptLoc = "/media/sf_mechanica/public/fileconvert/script.py";
	run_cmd("blender",
			["-b", "-P", scriptLoc, 
			 "--", "--read", filein, 
		     "--to", fileout],
		function(stdout, stderr, code){
			if(code !== 0 || stderr.indexOf("Traceback") !== -1 || stderr.indexOf("error") !== -1){
				if(onErr != null)
					onErr(stdout, stderr);
			}
		});
}

//TODO check if it's not already obj before converting
convertToObj("/media/sf_mechanica/public/fileconvert/testabc.abc",
	 "/media/sf_mechanica/public/fileconvert/out.obj", 
	 function(stdout, stderr){
		console.log("error while converting :" + stderr);
	 });
