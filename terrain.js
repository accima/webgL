	/*load Libreries*/
	document.writeln("<script src=\"libs/three.min.js\"></script>");
	document.writeln("<script src=\"libs/AnaglyphEffect.js\"></script>");
	document.writeln("<script src=\"libs/OrbitControls.js\"></script>");
	document.writeln("<script src=\"libs/Detector.js\"></script>");
	
	TR3 = new Object();
	/*Scene Container*/
	TR3.scene; TR3.renderer; TR3.camera; TR3.controls; TR3.material; TR3.mesh; TR3.fov = 30;
	
	/*Maps Params*/
	TR3.bboxImg = []; TR3.srsImg; TR3.widthImg; TR3.heightImg; TR3.tPixImg; TR3.zMed;		
	TR3.reducMesh = 10; TR3.reducMeshW; TR3.reducMeshH;
	
	/*Container*/
	TR3.desty;
	TR3.canvasDestW; TR3.canvasDestH;
	TR3.optionsSet = {cursor3d: true, anaglyph: false};
	
	/*Cursor3d*/
	TR3.helper;
	
	TR3.animate = function(){
		
		if(TR3.optionsSet.anaglyph){
			effect.render(TR3.scene, TR3.camera);
		}else{
			TR3.renderer.render(TR3.scene, TR3.camera);
		}
		
		TR3.controls.update();
		//request new frame
		requestAnimationFrame( TR3.animate );
	};
	
	TR3.assingZatMesh = function(arrayZ){
	
		var sum = 0;
		for(var i=0 ; i<arrayZ.length ; i++){
			sum=sum+arrayZ[i];
		}
		TR3.zMed=sum/i;
		
		var pos = TR3.mesh.geometry.getAttribute("position");
		for(var i=0 ; i<arrayZ.length ; i++){

			//sTerr.mesh.geometry.verticesNeedUpdate = true;
			pos.setZ( i, (arrayZ[i] - TR3.zMed)/TR3.tPixImg );
		}
		pos.needsUpdate = true;
				
		document.getElementById('loadingTerrain').style.display = 'none';
	};
	
	TR3.getZmeshAsc = function(widthDTM,heightDTM,bboxDTM0,bboxDTM1,bboxDTM2,bboxDTM3,srsDTM){
	
		var requestDTMwcs = new XMLHttpRequest();
		requestDTMwcs.open('GET', "proxy.php?url="+encodeURIComponent('https://servicios.idee.es/wcs-inspire/mdt?request=GetCoverage&service=WCS&version=1.0.0&coverage=Elevacion25830_25&format=ArcGrid&crs='//http://www.ign.es/wcs/mdt?SERVICE=WCS&REQUEST=GetCoverage&VERSION=1.0.0&CRS=
									+srsDTM+'&BBOX='+bboxDTM0+','+bboxDTM1+','+bboxDTM2+','+bboxDTM3+
									'&WIDTH='+widthDTM+'&HEIGHT='+heightDTM));
		requestDTMwcs.onload = function() {
			var txtDTMwcs = requestDTMwcs.responseText;
			var str = '\n ';
			if(txtDTMwcs.indexOf(str) != -1){
				var zConteint = txtDTMwcs.slice(txtDTMwcs.indexOf(str)+str.length);
			
				var sinSalto = zConteint.replace(/\r\n/g, " ");
				var sinFin = sinSalto.slice(0,sinSalto.length-1);
				var arrayZ = sinFin.split(" ");
				var lengthDTM = widthDTM*heightDTM; //vienen filas de más...
				var evalZ;
				for(var i=0 ;i<lengthDTM; i++){
					arrayZ[i] = evalZ = eval(arrayZ[i]);
					if(evalZ < -1000 || evalZ > 4000){
						arrayZ[i] = 0;
					}
				}
				TR3.assingZatMesh(arrayZ);
			}else{
				if(document.getElementById('loadingTerrain').style.display == 'block'){
					alert("WCS no load, trying DTM");
				}
			}
		}
		
		requestDTMwcs.send();
	};
	
	TR3.makeZmesh = function(){
	
		var arrZ;
		var widthDTM = TR3.reducMeshW + 1;
		var heightDTM = TR3.reducMeshH + 1;
		TR3.tPixImg = TR3.sizePix();
		var sizePix = TR3.tPixImg*TR3.reducMesh;
		
		var bboxDTM0 = TR3.bboxImg[0]-sizePix/2;
		var bboxDTM1 = TR3.bboxImg[1]-sizePix/2;
		var bboxDTM2 = TR3.bboxImg[2]+sizePix/2;
		var bboxDTM3 = TR3.bboxImg[3]+sizePix/2;
		var srsDTM = TR3.srsImg;

		arrZ = TR3.getZmeshAsc(widthDTM,heightDTM,bboxDTM0,bboxDTM1,bboxDTM2,bboxDTM3,srsDTM);

	};
	
	TR3.anaglyphOnOff = function(){
	
		if(TR3.optionsSet.anaglyph == true){
			TR3.optionsSet.anaglyph = false;
		}else{
			TR3.optionsSet.anaglyph = true
		}
	};
	
	TR3.makeWorld = function( imgOri ){
		
		if(typeof(imgOri) == 'object'){
			TR3.makeObjects(imgOri);
		}else{
			var imgOriUper = imgOri.toUpperCase();
			if(imgOriUper.indexOf('HTTP://')==-1){
				TR3.makeImageFromID(imgOri);
			}else{
				TR3.makeImageFromPath(imgOri);
			}
		}
	};
	
	TR3.makeImageFromPath = function(image){
	
		var imgConteint = new Image();
		imgConteint.onload = function() {
		
			TR3.makeObjects(imgConteint);
		};
		
		imgConteint.src = "proxy.php?url="+encodeURIComponent(image);
	};
	
	TR3.makeImageFromID = function(image){
		
		//var imgConteint = new Image();
		var imgConteint = document.getElementById(image);
		//var context = canvas.getContext('2d');
		//imgConteint.src = canvas.toDataURL();
		TR3.makeObjects(imgConteint);
	};
	
	TR3.makeObjects = function(imgConteint){
		
		TR3.widthImg = imgConteint.width;
		TR3.heightImg = imgConteint.height;
		
		/*Position Camera Ini*/
		var radianFOV = TR3.fov*2*Math.PI/360;
		TR3.camera.position.y = Math.cos(radianFOV/2)*(TR3.widthImg/2)/Math.sin(radianFOV/2);
		TR3.camera.position.z = TR3.camera.position.y*Math.sin(Math.PI/4);
		
		/*Texture-Material*/
		var texture = new THREE.Texture(imgConteint);
		texture.needsUpdate = true;
		TR3.material = new THREE.MeshBasicMaterial({map: texture});
		
		/*Reduction Mesh*/
		TR3.reducMeshW = Math.round(TR3.widthImg/TR3.reducMesh);
		TR3.reducMeshH = Math.round(TR3.heightImg/TR3.reducMesh);
		
		/*Image-Mesh*/
		var geometry = new THREE.PlaneBufferGeometry( TR3.widthImg, TR3.heightImg, TR3.reducMeshW, TR3.reducMeshH );
		//geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
		TR3.mesh = new THREE.Mesh( geometry, TR3.material);
		//TR3.mesh.geometry.dynamic = true;
		TR3.mesh.name = "mesh3d";
		TR3.mesh.rotation.x = -Math.PI/2;
		TR3.scene.add(TR3.mesh);
		
		/*Geometry Cursor3d*/
		var reducPointer = 8;
		var geometry = new THREE.CylinderBufferGeometry( TR3.widthImg/(4*reducPointer), 0, TR3.widthImg/reducPointer, 3 );
		geometry.translate( 0, TR3.widthImg/(2*reducPointer), 0 );
		TR3.helper = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial() );
		TR3.scene.add( TR3.helper );
		
		/*Add Z values to Mesh*/
		TR3.makeZmesh();
	};
	
	TR3.cvsDesty = function(){
		
		var canvasDest = document.getElementById('canvasDest');
		if(!canvasDest){
			canvasDest = document.createElement('CANVAS');
			canvasDest.id = 'canvasDest';
			canvasDest.setAttribute("width", TR3.canvasDestW);
			canvasDest.setAttribute("height", TR3.canvasDestH);

			document.getElementById(TR3.desty).appendChild(canvasDest);
		}
		
		return canvasDest;
	};
	
	TR3.divLoading = function(){
		
		var loadingTerrain = document.getElementById('loadingTerrain');
		if(!loadingTerrain){
			loadingTerrain = document.createElement('div');
			loadingTerrain.id = 'loadingTerrain';
			loadingTerrain.style.position = "absolute";
			loadingTerrain.style.top = 0;
			loadingTerrain.style.fontSize = "15px";
			loadingTerrain.style.margin = "5px";
			loadingTerrain.style.backgroundColor = "#bbb";
			loadingTerrain.innerHTML  = 'Loading maps, please wait...';

			document.getElementById(TR3.desty).appendChild(loadingTerrain);
		}else{
			document.getElementById('loadingTerrain').style.display = 'block';
		}
	};
	
	TR3.setMeshOptions = function(cursorOpt, anaglyphOpt){
		/*DTM*/
		var b4DTMopt = TR3.optionsSet.DTM;
		
		//if(DTMopt=="def"){DTMopt=false;}
		
		/*Cursor3d*/
		var cursorOpt = cursorOpt;
		
		if(cursorOpt=="def"){cursorOpt=true;}
		var infoGeo3d = document.getElementById('infoGeo3d');
		var cvsDesty = document.getElementById(TR3.desty)
		if( cursorOpt == true ){
			if(!infoGeo3d){
				infoGeo3d = document.createElement('div');
				infoGeo3d.id = "infoGeo3d";
				infoGeo3d.style.position = "absolute";
				infoGeo3d.style.top = 0;
				infoGeo3d.style.fontSize = "10px";
				infoGeo3d.style.margin = "5px";
				infoGeo3d.style.backgroundColor = "#fff";
				infoGeo3d.innerHTML  = '<b>Project: UTM - Datum: ETRS89</b><br><b>X:</b><br><b>Y:</b><br><b>Z:</b>';
				cvsDesty.appendChild(infoGeo3d);
			}else{
				infoGeo3d.style.display = 'block';
			}
			cvsDesty.style.cursor = "none";
		}else{
			infoGeo3d.style.display = 'none';
			cvsDesty.style.cursor = "auto";
		}
		
		/*Anaglyph*/
		var anaglyphOpt = anaglyphOpt;
		
		if(anaglyphOpt=="def"){anaglyphOpt=false;}

		TR3.optionsSet = {cursor3d: cursorOpt, anaglyph: anaglyphOpt};
		//if(b4DTMopt != DTMopt && TR3.widthImg){
		//	document.getElementById('loadingTerrain').style.display = 'block';
		//	TR3.makeZmesh();
		//}
	};
	
	TR3.divContainer = function(desty){
	
		var contMeshMap = document.getElementById(desty);
		if(!contMeshMap){
			alert("invalid destiny");
		}else{
			TR3.canvasDestW = parseInt(contMeshMap.style.width) || 500;
			TR3.canvasDestH = parseInt(contMeshMap.style.height) || 500;
			contMeshMap.style.position='relative';
		}
	};
	
	TR3.clearMeshMap = function( e ){
	
		var canvasDest = TR3.cvsDesty();
		
		if (canvasDest && Detector.webgl) {
			var scene = TR3.scene;
			while(scene && scene.children.length > 0){ 
				scene.remove(scene.children[0]); 
			}

			
			//var gl = canvasDest.getContext("webgl") || canvasDest.getContext("experimental-webgl");	// Initialize the GL context
			//gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
			//gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
			//gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things
			//gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);      // Clear the color as well as the depth buffer.
			//gl.getExtension('WEBGL_lose_context').loseContext();

			canvasDest.remove();
			
		}else if (canvasDest && Detector.canvas){
			var ctx = canvasDest.getContext("2d");
			ctx.clearRect(0, 0, canvasDest.width, canvasDest.height);
			canvasDest.remove();
		}
	};
	
	TR3.setMeshMap = function(imgOri,desty,BBOXimg,srsImg,optionsSet){
	
		/*INI params*/
		imgOri = imgOri || 'http://www.ign.es/wms-inspire/pnoa-ma?&VERSION=1.1.1&REQUEST=GetMap&LAYERS=OI.OrthoimageCoverage&FORMAT=image/jpeg&SRS=EPSG:25830&BBOX=647399,4220032,649899,4222532&EXCEPTIONS=application/vnd.ogc.se_inimage&width=500&height=500';
		TR3.desty = desty || 'contMeshMap';
		BBOXimg = BBOXimg || [647399,4220032,649899,4222532];
		srsImg = srsImg || 'EPSG:25830';
		TR3.setMeshOptions(optionsSet.cursor3d, optionsSet.anaglyph);
		
		/*Div container*/
		TR3.divContainer(desty);
		
		/*Div loading*/
		TR3.divLoading();
		
		TR3.clearMeshMap();
		/*Detector Renderer*/
		if(Detector.canvas){
			/*Get canvas Destiny*/
			var canvasDest = TR3.cvsDesty();
			if ( ! Detector.webgl ) {
				alert("Your browser does not seem to support WebGL. Please, upgrade your browser or try another one.");
			}else{
				TR3.renderer = new THREE.WebGLRenderer({ canvas: canvasDest });
			}
		}else{
			alert("Your browser does not seem to support HTML5 canvas. Please, upgrade your browser or try another one.");
		};
		
		TR3.renderer.setSize( TR3.canvasDestW, TR3.canvasDestH );

		/*Scene*/
		TR3.scene = new THREE.Scene();
		
		/*Camera*/
		TR3.camera = new THREE.PerspectiveCamera(TR3.fov, TR3.canvasDestW / TR3.canvasDestH, 1, 2000);
		
		/*Orbit Controls*/
		TR3.controls = new THREE.OrbitControls( TR3.camera, canvasDest );
		//TR3.controls.center.set(0.0, 0.0, 0.0);
		TR3.controls.maxPolarAngle = Math.PI/2;
		TR3.controls.minPolarAngle = 0 + 0.05;
		TR3.controls.userPanSpeed = 100;
		TR3.controls.autoRotate = true;
		
		/*Anaglyph*/
		effect = new THREE.AnaglyphEffect( TR3.renderer );
		effect.setSize( TR3.canvasDestW,  TR3.canvasDestH );
		
		/*Add subtle ambient lighting*/
		var ambientLight = new THREE.AmbientLight(0xffffff,0.5);
		TR3.scene.add(ambientLight);
		
		/*Create Image-Mesh*/
		TR3.bboxImg = BBOXimg;
		TR3.srsImg = srsImg;
		TR3.makeWorld( imgOri );
		
		/*Animate*/
		TR3.animate();
		
		/*Events*/
		window.addEventListener( 'resize', TR3.onWindowResize, false );
		canvasDest.addEventListener( 'mousemove', TR3.onMouseMove, false );
		canvasDest.addEventListener( 'click', function() {TR3.controls.autoRotate = false;}, false );
	};
	
	TR3.onWindowResize = function(){

		TR3.camera.aspect = TR3.canvasDestW / TR3.canvasDestH;
		TR3.camera.updateProjectionMatrix();

		TR3.renderer.setSize( TR3.canvasDestW, TR3.canvasDestH );
	};
	
	TR3.onMouseMove = function( event ) {
	
		var contDiv = document.getElementById(TR3.desty);
		var contTop = contDiv.offsetTop;
		var contLeft = contDiv.offsetLeft;
		while(contDiv.parentElement){
			contDiv = contDiv.parentElement;
			contTop += contDiv.offsetTop;
			contLeft += contDiv.offsetLeft;
		}
		
		if ( TR3.optionsSet.cursor3d ) {
			TR3.scene.add(TR3.helper);
			var mouseX = ( (event.clientX - contLeft) / TR3.canvasDestW ) * 2 - 1;
			var mouseY = -( (event.clientY - contTop) / TR3.canvasDestH ) * 2 + 1;

			var mouse = new THREE.Vector2( mouseX, mouseY );

			var raycaster = new THREE.Raycaster();
			raycaster.setFromCamera( mouse, TR3.camera );

			// See if the ray from the camera into the world hits one of our meshes
			var intersects = raycaster.intersectObject( TR3.mesh );

			// Toggle rotation bool for meshes that we clicked
			if (intersects.length > 0) {
				TR3.helper.position.set( 0, 0, 0 );
				//TR3.helper.lookAt( intersects[ 0 ].face.normal );

				TR3.helper.position.copy( intersects[ 0 ].point );
				TR3.redrawInfo(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z);
			}
		} else {
			TR3.scene.remove(TR3.helper);
		}
	};
	
	TR3.addInfo = function(info){
	
		document.getElementById('infoGeo3d').innerHTML = info;
	};
	
	TR3.sizePix = function(){
	
		var tPixW = (TR3.bboxImg[2]-TR3.bboxImg[0])/TR3.widthImg;
		var tPixH = (TR3.bboxImg[3]-TR3.bboxImg[1])/TR3.heightImg;
		var tPix = (tPixW+tPixH)/2;
		return tPix;
	};

	TR3.redrawInfo = function(X,Y,Z){

		var tPix = TR3.tPixImg;

		var info  = '<b>Project: UTM - Datum: ETRS89</b><br><b>X:</b> '+ Math.round((TR3.bboxImg[0] + (X + TR3.widthImg/2)*tPix)*100)/100 + '<br><b>Y:</b> ' + Math.round((TR3.bboxImg[1] + (-Z + TR3.heightImg/2)*tPix)*100)/100 + '<br><b>Z:</b> ' + Math.round((Y + TR3.zMed)*100)/100;
		TR3.addInfo(info);
	};