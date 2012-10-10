
//TODO: this is global and looks like is being redefined and reset multiple times... once per js file 
var application	= null;

var FileUtil = {
	
	//=======
	// SQLite
	//=======
Initialize: function(_app) {
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
	console.log("---- FileUtil.dumpFiles");
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
	console.log("---- FileUtil.dumpDirectory");
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


/*
getLeadingDirectory: function(filePath) {
	
}

createDirectories: function(filePath) {
	
	if (filePath === null)
		return true;
	
	// drop leading "/"
	if (filePath.substr(0, 1) === "/") {
		filePath = filePath.substr(1);
	}

	if (filePath === "")
		return true;
	
	var dirEndIndex = filePath.indexOf("/");
	
	// if if is just a filename and no more directories in front of it
	if (dirEndIndex === -1) {
		return true;
	}
	
	var dir = filePath.substr(0, dirEndIndex);
	
	
	
	
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
}
*/
saveTile: function(fileUrl, tileset, z, x, y, successCallback) {
	console.log("---- FileUtil.saveTile.fileUrl: " + fileUrl);
	console.log("---- FileUtil.saveTile.tileset: " + tileset);
	console.log("---- FileUtil.saveTile.z: " + z);
	console.log("---- FileUtil.saveTile.x: " + x);
	console.log("---- FileUtil.saveTile.y: " + y);


	console.log("---- fileSystem.root: " + fileSystem.root.name);

	var extention = fileUrl.substr(fileUrl.lastIndexOf("."));
	console.log("---- extention: " + extention);

	// do I need this? maybe file download can handle missing
	// directories?
	fileSystem.root.getDirectory(tileset, {create: true}, 
		function(tilesetDirEntry){
			console.log("---- tilesetDirEntry: " + tilesetDirEntry.fullPath);
			tilesetDirEntry.getDirectory("" + z, {create: true}, 
				function(zDirEntry){
					console.log("---- zDirEntry: " + zDirEntry.fullPath);
					zDirEntry.getDirectory("" + x, {create: true}, 
						function(xDirEntry){
							console.log("---- xDirEntry: " + xDirEntry.fullPath);
							var filePath = xDirEntry.fullPath + "/" + y + extention; 
							
							console.log("==== will store file at: " + filePath);
					
							var fileTransfer = new FileTransfer();
							var uri = encodeURI(fileUrl);
					
							fileTransfer.download(
								uri,
								filePath,
								function(entry) {
									console.log("download complete: " + entry.fullPath);
									FileUtil.dumpDirectory(xDirEntry);
				
									if (successCallback){
										successCallback(filePath);
									}
								},
								function(error) {
									console.log("download error source " + error.source);
									console.log("download error target " + error.target);
									console.log("upload error code" + error.code);
								}
							);
						}
					);
				}
			);
		}
	);

	
	return;
}
    
};