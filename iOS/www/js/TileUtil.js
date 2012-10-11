
//TODO: this is global and looks like is being redefined and reset multiple times... once per js file 
var application	= null;

var TileUtil = {
	
	//=======
	// SQLite
	//=======
Initialize: function(_app) {
    window.alert("chk1.5");

	if(_app) {
        application = _app;
    }
    
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
		function(fs){
		fileSystem = fs;
			console.log("====[ got fileSystem. ");
		}, 
		function(error) {
			console.log("====>> failed to get fileSystem. error: " + error.code);
		}
	);    
},
		
dumpFiles: function() {
	console.log("---- TileUtil.dumpFiles");
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
		function(fileSystem){
			try {
				 console.log("---- fileSystem.root: " + fileSystem.root.name);
				 var directoryReader = fileSystem.root.createReader();
				 directoryReader.readEntries(
					function(entries) {
						 var i;
						 for (i=0; i<entries.length; i++) {
							 if (entries[i].isDirectory) {
								 console.log("--{ Dir: " + entries[i].name, "path: " + entries[i].fullPath);
							 } else {
								 console.log("--{ File: " + entries[i].name, "path: " + entries[i].fullPath);
							 }
						 }
					},
					function(){
						console.log("====>> failDirectoryReader");
					}
				);
			} catch (e) {
				console.log("====>> dumpFiles.exception: "+ e);
			}
		}, 
		function(error) {
			console.log("====>> failed to get fileSystem. error: " + error.code);
		}
	);	
},

dumpDirectory: function(dir) {
	console.log("---- TileUtil.dumpDirectory");
	try {
		console.log("---- fileSystem.dir: " + dir.name);
		var directoryReader = dir.createReader();
		directoryReader.readEntries(
				function(entries) {
					var i;
					for (i=0; i<entries.length; i++) {
						if (entries[i].isDirectory) {
							console.log("--{ Dir: " + entries[i].name, "path: " + entries[i].fullPath);
						} else {
							console.log("--{ File: " + entries[i].name, "path: " + entries[i].fullPath);
						}
					}
				},
				function(){
					console.log("====>> failDirectoryReader");
				}
		);
	} catch (e) {
		console.log("====>> dumpDirectory.exception: "+ e);
	}
},

saveTile: function(fileUrl, tileset, z, x, y, successCallback, errorCallback) {
	console.log("---- TileUtil.saveTile. tileset: " + tileset + ", z: " + z + ", x: " + x + ", y: " + y + ", url: " + fileUrl);

	var extention = fileUrl.substr(fileUrl.lastIndexOf("."));
	console.log("---- TileUtil.saveTile.extention: " + extention);

	fileSystem.root.getDirectory(tileset, {create: true}, 
		function(tilesetDirEntry){
			//console.log("---- tilesetDirEntry: " + tilesetDirEntry.fullPath);
			tilesetDirEntry.getDirectory("" + z, {create: true}, 
				function(zDirEntry){
					//console.log("---- zDirEntry: " + zDirEntry.fullPath);
					zDirEntry.getDirectory("" + x, {create: true}, 
						function(xDirEntry){
							//console.log("---- xDirEntry: " + xDirEntry.fullPath);
							var filePath = xDirEntry.fullPath + "/" + y + extention; 
							
							//console.log("==== will store file at: " + filePath);
					
							var fileTransfer = new FileTransfer();
							var uri = encodeURI(fileUrl);
					
							fileTransfer.download(
								uri,
								filePath,
								function(entry) {
									//console.log("download complete: " + entry.fullPath);
									//TileUtil.dumpDirectory(xDirEntry);
				
									if (successCallback){
										successCallback(filePath);
									}
								},
								function(error) {
									console.log("download error source " + error.source);
									console.log("download error target " + error.target);
									console.log("upload error code" + error.code);
									
									if (errorCallback){
										errorCallback(error);
									}
								}
							);
						}
					);
				}
			);
		}
	);

	var filePath2 = fileSystem.root.fullPath + "/" + tileset +"/" + z + "/" + x + "/" + y + extention;
	
	// NOTE: file may not be ready for reading yet since write operation is async
	return filePath2;
}

};