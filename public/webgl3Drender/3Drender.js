var gl;
	var shaderProgram;
	
	var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
	var mvMatrixStack = [];
	
    var vertexPosBuffer;
	var vertexColorBuffer;
	var trianglesBuffer;
	var vertices;
	var triangles;
	var uniformScale = 1;
	var offset = [0, 0, 0];
	
	//click logic vars------------------------------
	//tmp vars are for while the user is clicking
	//and base vars are value a the end of a user click
	//the full value is tmp + base
	var baseRot = [0, 0, 0];
	var tmpRot = [0, 0, 0];
	
	var basePos = [0, 0, 0];
	var tmpPos = [0, 0, 0];
	
	var zoom = 0;
	var maxZoom = 3;
	//true means the first mouse button is being pressed
	//meaning we are rotating the object
	var mouseDownRot = false;
	var mouseDownRotMovePos;
	//same as above but for the middle click and moving the object
	var mouseDownMove = false;
	var mouseDownMovePos;
	
	function getDeltaPos(startPos, x, y){
		return {
			x : x - startPos.x,
			y : y - startPos.y
		};
	}
	
	function updateRot(startPos, event){
		var x = event.pageX;
		var y = event.pageY;
		var deltaPos = getDeltaPos(startPos, x, y);

		return [
			degToRad(deltaPos.y),
			degToRad(deltaPos.x),
			0
		];
	}
	
	function updatePos(startPos, event){
		var x = event.pageX;
		var y = event.pageY;
		var deltaPos = getDeltaPos(startPos, x, y);
		
		return [
			deltaPos.x / 100.0,
			deltaPos.y / 100.0,
			0
		];
	}
	
	function getFullRot(){
		return[
			tmpRot[0] + baseRot[0],
			tmpRot[1] + baseRot[1],
			tmpRot[2] + baseRot[2]
		];	
	}
	
	function getFullPos(){
		return[
			tmpPos[0] + basePos[0],
			-tmpPos[1] + basePos[1], //y component is inverted
			tmpPos[2] + basePos[2]
		];
	}
	
	function initMouseControl(canvas){
		canvas.addEventListener("mousedown", onMouseDown, false);
		canvas.addEventListener("mousemove", onMouseMove, false);
		canvas.addEventListener("mouseup", onMouseUp, false);
		canvas.addEventListener("mouseout", onMouseOut, false);
		canvas.addEventListener("wheel", onMouseWheel, false);
	}
	
	function onMouseWheel(event){
		
		zoom -= event.deltaY;
		if(zoom > maxZoom)
			zoom = maxZoom;
	}
	
	function onMouseDown(event){
		var x = event.pageX;
		var y = event.pageY;
		
		if(event.button === 0){
			mouseDownRot = true;
			mouseDownRotMovePos = { 
				x : x, 
				y : y 
			};
		}
		
		if(event.button === 1){
			mouseDownMove = true;
			mouseDownMovePos = {
				x : x,
				y : y
			};
		}
	}
	
	function onMouseMove(event){
		if(mouseDownRot){
			tmpRot = updateRot(mouseDownRotMovePos, event);
		}
		
		if(mouseDownMove){
			tmpPos = updatePos(mouseDownMovePos, event);
		}
	}
	
	function onMouseUp(event){
		if(mouseDownRot){
			mouseDownRot = false;
			
			tmpRot = updateRot(mouseDownRotMovePos, event);
			baseRot = getFullRot();
			tmpRot = [0, 0, 0];
		}
		
		if(mouseDownMove){
			mouseDownMove = false;
			tmpPos = updatePos(mouseDownMovePos, event);
			basePos = getFullPos();
			tmpPos = [0, 0, 0];
		}
	}
	
	function onMouseOut(event){
		if(mouseDownRot || mouseDownMove){
			onMouseUp(event);
		}
	}
	
	function calculateScale(){
		//find the 8 extremes of the model, then find a multiplier to make it fit a predefined box
		let minX = vertices[0], minY = vertices[1], minZ = vertices[2],
			maxX = vertices[0], maxY = vertices[1], maxZ = vertices[2];
		
		//find the extremities of the model
		//note : doing a simple average to find the mid point wouldn't work
		//because areas with more vertices would unbalance the middle
		for(let i = 0; i < vertices.length; i += 3){
			if(vertices[i] > maxX)
				maxX = vertices[i];
			if(vertices[i] < minX)
				minX = vertices[i];
			
			if(vertices[i+1] > maxY)
				maxY = vertices[i+1];
			if(vertices[i+1] < minY)
				minY = vertices[i+1];
			
			if(vertices[i+2] > maxZ)
				maxZ = vertices[i+2];
			if(vertices[i+2] < minZ)
				minZ = vertices[i+2];
		}
		
		//find the middle of the shape, then get the vector to the middle
		let middle = [(maxX + minX) / 2, 
					  (maxY + minY) / 2,
					  (maxZ + minZ) / 2];
		//-middle = vector from 0 to middle
		offset = middle.map(v => -v);
		
		//bake the offset directly in the model
		for(let i = 0; i < vertices.length; i += 3){
			vertices[i] += offset[0];
			vertices[i+1] += offset[1];
			vertices[i+2] += offset[2];
		}

		//find what we have to multiply each component by for it to scale inside 
		//a 2*2*2 box (taking in account the fact that we offset the model)
		let sx = 2/(maxX + offset[0]);
		let sy = 2/(maxY + offset[1]);
		let sz = 2/(maxZ + offset[2]);
		uniformScale = Math.min(sx, sy, sz);
	}

	//before calling this you have to set the "vertices" and "triangles" variables
	function webGLStart() {
        var canvas = document.getElementById("glcanvas");
		calculateScale();
		initMouseControl(canvas);
        initGL(canvas);
        initShaders();
        initBuffers();
		
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        tick();
    }
	
    function initGL(canvas) {
        try {
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
    }
    
    function initShaders() {
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");
        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }
        gl.useProgram(shaderProgram);
		
		//Setup attributes
        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
		
		shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
		
        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    }
	
    function initBuffers() {
        vertexPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
        /*vertices = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,
            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,
            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,
            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0
        ];*/
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        vertexPosBuffer.itemSize = 3;
        vertexPosBuffer.numItems = vertices.length/3;
		
		trianglesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, trianglesBuffer);
        /*var cubeVertexIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];*/
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), gl.STATIC_DRAW);
        trianglesBuffer.itemSize = 1;
        trianglesBuffer.numItems = triangles.length;
		
		
		vertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
       /* var colors = [
            [1.0, 0.0, 0.0, 1.0], // Front face
            [1.0, 1.0, 0.0, 1.0], // Back face
            [0.0, 1.0, 0.0, 1.0], // Top face
            [1.0, 0.5, 0.5, 1.0], // Bottom face
            [1.0, 0.0, 1.0, 1.0], // Right face
            [0.0, 0.0, 1.0, 1.0]  // Left face
        ];
        var unpackedColors = [];
        for (var i in colors) {
            var color = colors[i];
            for (var j=0; j < 4; j++) {
                unpackedColors = unpackedColors.concat(color);
            }
        }*/
		colors = [];
		for(var i = 0; i < vertexPosBuffer.numItems; i++){
			colors = colors.concat([Math.random(), Math.random(), Math.random(), 1.0]);
		}
		
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        vertexColorBuffer.itemSize = 4;
        vertexColorBuffer.numItems = vertexPosBuffer.numItems;
    }
	
	function tick() {
        requestAnimationFrame(tick);
        drawScene();
    }
	
    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
        mat4.identity(mvMatrix);

		
		mvPushMatrix();
		var rot = getFullRot();
		var pos = getFullPos();
		pos[2] = zoom;
		
		var all = [pos, [0, 0, -7]];
		var trans = [0, 0, 0];
		for(var i = 0; i < all.length; i++){
			trans[0] += all[i][0];
			trans[1] += all[i][1];
			trans[2] += all[i][2];
		}
		
		mat4.translate(mvMatrix, trans);
		//mat4.translate(mvMatrix, offset);
		//mat4.translate(mvMatrix, pos);
        //mat4.translate(mvMatrix, [0, 0, -7.0]);
		
		mat4.scale(mvMatrix, [uniformScale, uniformScale, uniformScale]);

		mat4.rotate(mvMatrix, rot[0], [1, 0, 0]);
		mat4.rotate(mvMatrix, rot[1], [0, 1, 0]);
		mat4.rotate(mvMatrix, rot[2], [0, 0, 1]);
		
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, trianglesBuffer);
		
        setMatrixUniforms();
        //gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPosBuffer.numItems);
		gl.drawElements(gl.TRIANGLES, trianglesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		mvPopMatrix();
    }
	
	function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }
        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }
        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }
        gl.shaderSource(shader, str);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }
	
    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }
	
	function mvPushMatrix() {
        var copy = mat4.create();
        mat4.set(mvMatrix, copy);
        mvMatrixStack.push(copy);
    }
	
    function mvPopMatrix() {
        if (mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
		
        mvMatrix = mvMatrixStack.pop();
    }
	
	function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }