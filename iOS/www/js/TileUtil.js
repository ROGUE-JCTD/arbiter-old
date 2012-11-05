var TileUtil = {

debug: false,		
		
dumpFiles: function() {
	console.log("---- TileUtil.dumpFiles");
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
		function(fs){
			try {
				 console.log("---- fs.root: " + fs.root.name);
				 var directoryReader = fs.root.createReader();
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
			console.log("====>> failed to get fs (fileSystem) error: " + error.code);
		}
	);	
},

dumpDirectory: function(dir) {
	console.log("---- TileUtil.dumpDirectory");
	try {
		console.log("---- dir: " + dir.name);
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
	
	Arbiter.fileSystem.root.getDirectory(tileset, {create: true}, 
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

	var filePath2 = Arbiter.fileSystem.root.fullPath + "/" + tileset +"/" + z + "/" + x + "/" + y + extention;
	
	// NOTE: file may not be ready for reading yet since write operation is async
	return filePath2;
},

// start caching the cacheTile
startCachingTiles: function() {
	console.log("---- startCachingTiles");
	
    var layer = map.baseLayer,
        zoom = map.getZoom();

    caching = {
        zoom: zoom,
        extent: map.getExtent(),
        center: map.getCenter(),
        buffer: layer.buffer,
        layer: layer, 
        counter: 0,
        counterEstimatedMax: TileUtils.countTilesInBounds()
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
    var tileHeight = layer.tileSize.h;

    var zoomLevel = map.getZoom();
    
    var totalTiles = 0;
    
    while (zoomLevel < layer.numZoomLevels) {

        var extentWidth = map.getExtent().getWidth() / map.getResolutionForZoom(zoomLevel);
        
        var widthInTiles = Math.ceil(extentWidth / tileWidth);
        // add one for good measure since when the buffer is computed during caching, it tries to subtract 
        // the tiles that are already downloaded. but since the map is not square (and layer.buffer essentially assumes it is since we dont have layer.buffer.x and layer.buffer.y), 
        // we can have more tiles already downloaded vertically than horizontally. Also, the center of map can be falling such that we have more tiles needed in the view vertically 
        // vs horizontally or vice versa. It can be computed but for now probably not worth it. 
        widthInTiles += 1;  /// seems like map always gets 3x3. if this is really true, layer.buffer can just be set to Math.ceil(extentWidth / tileWidth); - 1.5
        totalTiles += widthInTiles * widthInTiles;
        
        // Test data
        // widthInTiles+1       widthInTiles+1.5    count..InBounds2 actual 
        // 218                  248                 212              217  
        // 623                  673                 684              715
        // 2466                 2562                2460             2482
        // 9190                 9369                9184             9235 (45.2MB) 
        //
        //
        //
        console.log("-----<< Will cache " + widthInTiles * widthInTiles + " tiles for zoom level: " + zoomLevel + "widthInTiles: " + widthInTiles);
        
    	zoomLevel += 1;
    }
    
    console.log("=====<< simple method Will cache " + totalTiles + " tiles for all " + (layer.numZoomLevels - map.getZoom()) + " zoom levels");
    //alert("Will cache " + totalTiles + " tiles for all " + (layer.numZoomLevels - map.getZoom()) + " zoom levels");
    
    return totalTiles;
},

countTilesInBounds2: function (){
    var layer =  map.baseLayer;
    var tileWidth = layer.tileSize.w;
    var tileHeight = layer.tileSize.h;

    var zoomLevel = map.getZoom();
    
    var totalTiles = 0;
    
    while (zoomLevel < layer.numZoomLevels) {

        var extentWidth = map.getExtent().getWidth() / map.getResolutionForZoom(zoomLevel);
        
        // buffer is being computed the same way it gets computed in cacheTile to help get as close of an estimate as possible 
        // the number of tiles downloaded should really be  Math.ceil(extentWidth / tileWidth) * Math.ceil(extentHeight / tileHeight);
        // but we're playing along since we want to be as close to the number we actually end up downloading as possible. 
        var buffer = Math.ceil((extentWidth / tileWidth - map.getSize().w / tileWidth) / 2);
        var widthInTiles =  Math.ceil(buffer * 2 + map.getSize().w / tileWidth);
        var heightInTiles =  Math.ceil(buffer * 2 + map.getSize().h / tileHeight);
        totalTiles += (widthInTiles * heightInTiles);
        
        //alert("Will cache " + (widthInTiles * widthInTiles) + " tiles for zoom level: " + zoomLevel);
        console.log("-----<< Will cache " + (widthInTiles * heightInTiles) + " tiles for zoom level: " + zoomLevel + " widthInTiles: " + widthInTiles + " heightInTiles: " + heightInTiles);
        
    	zoomLevel += 1;
    }
    
    console.log("=====<< complex method Will cache " + totalTiles + " tiles for all " + (layer.numZoomLevels - map.getZoom()) + " zoom levels");
    //alert("Will cache " + totalTiles + " tiles for all " + (layer.numZoomLevels - map.getZoom()) + " zoom levels");
    
    return totalTiles;
},

// cacheTile a zoom level based on the extent at the time startCachingTiles was called
cacheTile: function() {
    var layer = caching.layer;
    var tileWidth = layer.tileSize.w;
    var nextZoom = map.getZoom() + 1;

    if (nextZoom === layer.numZoomLevels) {
    	console.log("caching tiles completed: additional " + caching.counter + " cached. estimated max: " + caching.counterEstimatedMax);
        TileUtil.stopCachingTiles();
    } else {
        var extentWidth = caching.extent.getWidth() / map.getResolutionForZoom(nextZoom);
        // adjust the layer's buffer size so we don't have to pan
        layer.buffer = Math.ceil((extentWidth / tileWidth - map.getSize().w / tileWidth) / 2);
        //alert("setting buffer to: " + layer.buffer + ", for zoom: " + nextZoom);
        map.zoomIn();
    }
},

// stop caching (when done or when cacheTile is full)
stopCachingTiles : function() {
	// we're done - restore previous settings
	caching.layer.events.unregister("loadend", null, TileUtil.cacheTile);
	caching.layer.buffer = caching.buffer;
	map.setCenter(caching.center, caching.zoom);

	caching = false;
},

// clear entries in db, removed tiles from device
clearCache : function(tileset) {
	if (TileUtil.debug) {
		console.log("---- TileUtil.clearCache");
	}	
///*	
//	var directoryReader = Arbiter.fileSystem.root.createReader();
//	
//	Arbiter.fileSystem.root.getDirectory(tileset, {create: false}, 
//			function(tilesetDir){
//				tilesetDir.removeRecursively(					
//					function(entry) {
//						// now that the files were removed, remove key value pairs 
//						window.localStorage.setItem("tile_" + finalUrl, tilePath);
//						
//					},
//					function(error) {
//						console.log("====>> Error remove directory recursively failed" + error.source);
//					});
//			}
//		);	
//
}, 

getURL: function(bounds) {
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
    	
		var saveTileSuccess = function(url, path){
		};
		
		var saveTileError = function(url, path, error){
			console.log("========>> saveTileError filename: " + url + ", path: " + path);
			// if save failed, remove it. 
			TileUtil.removeTile(url, path);
		};
		
		tilePath = TileUtil.saveTile(finalUrl, "osm", xyz.z, xyz.x, xyz.y, saveTileSuccess, saveTileError);
		
		if (typeof caching !== 'undefined' && typeof caching.counter !== 'undefined') {
			caching.counter = caching.counter + 1;
		}

		if (TileUtil.debug) {
			console.log("<<<<<<<< ------ cach tile: " + finalUrl + " to: " + tilePath);
		}

		
		//Add it immediately before we have confirmation that it has saved so that we do not download it multiple times
		TileUtil.addTile(finalUrl, tilePath);
	}
    
	return tilePath;
}, 

addTile: function(url, path) {
	window.localStorage.setItem("tile_" + url, path);

	// add to global.tiles table: if there already, increment ref counter
	// add id to project.variablesDatabase.tileIds
	// TODO: add entry to groutDatabase
}, 

removeTile: function(url, path) {
	window.localStorage.removeItem("tile_" + url);
	
	// decrement ref counter in global.tiles. if it hits 0, remove file from device
	// remove from project.variablesDatabase.tileIds
	// TODO: remove entry from groutDatabase
}

};
