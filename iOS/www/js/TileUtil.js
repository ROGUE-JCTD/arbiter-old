
//TODO: this is global and looks like is being redefined and reset multiple times... once per js file 
var application	= null;

var TileUtil = {
debug: false,		
	
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
			if (TileUtil.debug) {
				console.log("====[ got fileSystem. ");
			}
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
	if (TileUtil.debug) {
		console.log("---- TileUtil.saveTile. tileset: " + tileset + ", z: " + z + ", x: " + x + ", y: " + y + ", url: " + fileUrl);
	}

	var extention = fileUrl.substr(fileUrl.lastIndexOf("."));
	//console.log("---- TileUtil.saveTile.extention: " + extention);

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
										successCallback(fileUrl, filePath);
									}
								},
								function(error) {
									console.log("download error source " + error.source);
									console.log("download error target " + error.target);
									console.log("upload error code" + error.code);
									
									if (errorCallback){
										errorCallback(fileUrl, filePath, error);
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
},

// start caching the cacheTile
startCachingTiles: function() {
	alert("start caching");
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^++++++++ startCachingTiles");
    var layer = map.baseLayer,
        zoom = map.getZoom();

    caching = {
        zoom: zoom,
        extent: map.getExtent(),
        center: map.getCenter(),
        buffer: layer.buffer,
        layer: layer, 
        counter: 0
    };
    
    var zoom2 = zoom + 1;
    
    if (zoom === layer.numZoomLevels-1) {
    	 zoom2 = zoom - 1;
    }
    
    // make sure the next setCenter triggers a load
    map.zoomTo(zoom === layer.numZoomLevels ? zoom - 1 : zoom + 1);
    console.log("zoom " + zoom );
    console.log("zoomTo " + zoom2 );
    
    layer.events.register("loadend", null, TileUtil.cacheTile);
    
    // start caching
    map.setCenter(caching.center, zoom);
},

countTilesInBounds: function (){
    var layer =  map.baseLayer;
    var tileWidth = layer.tileSize.w;

    var zoomLevel = map.getZoom();
    
    var totalTiles = 0;
    
    while (zoomLevel < layer.numZoomLevels) {

        var extentWidth = map.getExtent().getWidth() / map.getResolutionForZoom(zoomLevel);
        var buffer = Math.ceil((extentWidth / tileWidth - map.getSize().w / tileWidth) / 2);    	
    	
        // buffer * 2 is one side of the rectangle. squared to get tiles in the rect.  
        totalTiles += ((buffer * 2) * (buffer * 2));

        alert("Will cache " + ((buffer * 2) * (buffer * 2)) + " tiles for zoom level: " + zoomLevel + ", buffer: " + buffer);
        
    	zoomLevel += 1;
    }
    
    alert("Will cache " + totalTiles + " tiles for " + (layer.numZoomLevels - map.getZoom()) + " zoom levels");
    
    return totalTiles;
},

// cacheTile a zoom level based on the extent at the time startCachingTiles was called
cacheTile: function() {
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^  cacheTile");
    var layer = caching.layer;
    var tileWidth = layer.tileSize.w;
    var nextZoom = map.getZoom() + 1;

    if (nextZoom === layer.numZoomLevels) {
        TileUtil.stopCachingTiles();
    } else {
        var extentWidth = caching.extent.getWidth() / map.getResolutionForZoom(nextZoom);
        // adjust the layer's buffer size so we don't have to pan
        layer.buffer = Math.ceil((extentWidth / tileWidth - map.getSize().w / tileWidth) / 2);
        alert("setting buffer to: " + layer.buffer + ", for zoom: " + nextZoom);
        map.zoomIn();
    }
},

// stop caching (when done or when cacheTile is full)
stopCachingTiles: function() {
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^-------- stopCachingTiles");
    // we're done - restore previous settings
    caching.layer.events.unregister("loadend", null, TileUtil.cacheTile);
    caching.layer.buffer = caching.buffer;
    map.setCenter(caching.center, caching.zoom);

    alert("stop caching. counter: " + caching.counter);
         
    caching = false;
}, 

getURL: function(bounds) {
	
	//console.log("~~~~ bounds.left: " + bounds.left + ", top: " + bounds.top + ", right: " + bounds.right + ", bottom: " + bounds.bottom);
	//console.log("~~~~ this.maxExtent.left: " + this.maxExtent.left + ", top: " + this.maxExtent.top + ", right: " + this.maxExtent.right + ", bottom: " + bounds.bottom);

	var xyz = this.getXYZ(bounds);
    var url = this.url;
    if (OpenLayers.Util.isArray(url)) {
        var s = '' + xyz.x + xyz.y + xyz.z;
        url = this.selectUrl(s, url);
    }
    
    var finalUrl = OpenLayers.String.format(url, xyz);
    
    var tilePath = window.localStorage.getItem("tile_" + finalUrl);
    
    if (tilePath) {
    	if (TileUtil.debug) {
    		console.log("<<<<<<<< ++++++ founed cached tile: " + tilePath + " for " + finalUrl);
    	}
    } else {
    	
		var saveTileSuccess = function(url, filename){
		}
		
		var saveTileError = function(url, filename, error){
			console.log("========>> saveTileError filename: " + url + ", filename: " + filename);
			// if save failed, remove it. 
			window.localStorage.removeItem("tile_" + url);
		}
		
		tilePath = TileUtil.saveTile(finalUrl, "osm", xyz.z, xyz.x, xyz.y, saveTileSuccess, saveTileError);
		
		if (typeof caching != 'undefined' && typeof caching.counter != 'undefined') {
			caching.counter = caching.counter + 1;
		}

		if (TileUtil.debug) {
			console.log("<<<<<<<< ------ cach tile: " + finalUrl + " to: " + tilePath);
		}

    	//Add it immediately before we have confirmation that it has saved so that we do not download it multiple times
		window.localStorage.setItem("tile_" + finalUrl, tilePath);			        	
	}
    
	return tilePath;
}

};