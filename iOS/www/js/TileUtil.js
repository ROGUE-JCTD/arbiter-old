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

// start caching the cacheTile
startCachingTiles: function() {
	console.log("---- startCachingTiles");
	
    var layer = map.baseLayer;

    caching = {
        extentOriginal: map.getExtent(),		// extent before we start caching
        extent: Arbiter.currentProject.aoi,		// extent that we should use as starting point of caching
        buffer: layer.buffer,
        layer: layer, 
        counterCached: 0,
        counterEstimatedMax: TileUtil.countTilesInBounds(Arbiter.currentProject.aoi)
    };

	console.log("---- startCachingTiles. counterEstimatedMax: " + caching.counterEstimatedMax);
    
	//TODO: zoom to a level other than caching.extent
    // make sure the next setCenter triggers a load
	var startZoom = map.getZoomForExtent(caching.extent, true);
    map.zoomTo(startZoom === layer.numZoomLevels ? startZoom - 1 : startZoom + 1);
    
    layer.events.register("loadend", null, TileUtil.cacheTilesForCurrentZoom);
    
    // start caching
    map.zoomToExtent(caching.extent, true);
},

countTilesInBounds: function (bounds){
    var layer =  map.baseLayer;
    var tileWidth = layer.tileSize.w;
    var tileHeight = layer.tileSize.h;

    var zoomLevel = map.getZoomForExtent(bounds, true);;
    
    var totalTiles = 0;
    
    while (zoomLevel < layer.numZoomLevels) {

        var extentWidth = bounds.getWidth() / map.getResolutionForZoom(zoomLevel);
        
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
cacheTilesForCurrentZoom: function() {
    var layer = caching.layer;
    var tileWidth = layer.tileSize.w;
    var nextZoom = map.getZoom() + 1;

    if (nextZoom === layer.numZoomLevels) {
    	console.log("caching tiles completed: additional " + caching.counterCached + " cached. estimated max: " + caching.counterEstimatedMax);
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
	caching.layer.events.unregister("loadend", null, TileUtil.cacheTilesForCurrentZoom);
	caching.layer.buffer = caching.buffer;
    map.zoomToExtent(caching.extentOriginal, true);
    
    console.log("---- stopCachingTiles");

    
    // keep for debugging
    cachingLast = caching;
    
	caching = undefined;
},

// clear entries in db, removed tiles from device
clearCache : function(tileset) {
	if (TileUtil.debug) {
		console.log("---- TileUtil.clearCache");
	}	

	//alert("inserted tile. id: " + res.insertId);
	Arbiter.currentProject.variablesDatabase.transaction(function(tx){
		var sql = "SELECT id FROM tileIds;";
		tx.executeSql(sql, [], function(tx, res){
			
			for(var i = 0; i < res.rows.length; i++){
				var tileId = rows.item(i).id;
				
				//TODO: consider collect all the delete statement and execute one command against tileIds
				TileUtil.removeTileById(tileId);
			}
		});
	}, Arbiter.errorSql, function(){});		
}, 


//TODO SM: test getURL
getURL: function(bounds) {
	
	var xyz = this.getXYZ(bounds);
    var url = this.url;
    if (OpenLayers.Util.isArray(url)) {
        var s = '' + xyz.x + xyz.y + xyz.z;
        url = this.selectUrl(s, url);
    }
    
    var finalUrl = OpenLayers.String.format(url, xyz);
    
    if (TileUtil.debug) {
    	console.log("--- TileUtil.getURL.url: " + finalUrl);
    }
    
    //var tilePath = window.localStorage.getItem("tile_" + finalUrl);
    
    var tilePath = null;
	//console.log("--- TileUtil chk 1");

	// add to global.tiles table. if already exists, increment ref counter
	Arbiter.globalDatabase.transaction(function(tx){
		//console.log("--- TileUtil chk 2");
		
		var selectTileSql = "SELECT url FROM tiles WHERE url=?;";
		
		if (TileUtil.debug) {
			console.log("SQL: " + selectTileSql + "params: " + finalUrl);
		}

		//console.log("--- TileUtil chk 2.5");
		
		tx.executeSql(selectTileSql, [finalUrl], function(tx, res){
			//console.log("--- TileUtil chk 3");
			
			if (TileUtil.debug) {
				console.log("getURL.res.rows.length: " + res.rows.length);
				console.log(TileUtil.rowsToString(res.rows));
			}
			
			if (res.rows.length === 0){
				if (caching) { 
					var saveTileSuccess = function(url, path){
						if (typeof caching !== 'undefined' && typeof caching.counterCached !== 'undefined') {
							caching.counterCached += 1;
							console.log("caching percent complete: " +  caching.counterCached/caching.counterEstimatedMax);
						}
					};
					
					var saveTileError = function(url, path, error){
						console.log("========>> saveTileError filename: " + url + ", path: " + path);
						alert("failed to download file. todo.");
						//TODO: failed to download file and save to disk so just remove it from global.tiles and project.tileIds tables
						// if save failed, remove it. 
						//TileUtil.removeTile(url, path);
					};
					
					tilePath = TileUtil.saveTile(finalUrl, "osm", xyz.z, xyz.x, xyz.y, saveTileSuccess, saveTileError);

					if (TileUtil.debug) {
						console.log("<<<<<<<< ------ cach tile: " + finalUrl + " to: " + tilePath);
					}
				}


			} else if (res.rows.length === 1) {
				tilePath =  res.rows.item(0).path;
			} else {
				console.log("====>> ERROR: TileUtil.getURL: Multiple Entries for tile " + TileUtil.rowsToString(res.rows));
				alert("TileUtil.getURL: Multiple Entries for tile! see console for details. count: " + res.rows.length);
			}	
			//console.log("--- TileUtil chk 4");
			
		});	
	}, Arbiter.errorSql, function(){});	
    
	//console.log("--- TileUtil chk 5");
   
	// very unlikely we'll have the tile path. since even if we have the file locally, tx to get it is async
    if (tilePath) {
    	if (TileUtil.debug) {
    		console.log("<<<<<<<< ++++++ founed cached tile already. wow: " + tilePath + " for " + finalUrl);
    	}
    } else {
 		
    	// stitch a tile path together and hope that either file is there or if it is being saved for the first time, 
    	// it finishes saving before openlayers uses it. Unlikely but not impossible. 
    	
    	// this is the best we can do unles this call actually truely blocks the thread without hammering the cpu and running down battery life
    	// can probably do a syncronous ajax call with diration of pause in the loop but will probably fail when there is no connection
    	// consider other blocking calls like printing to console 
    	tilePath = Arbiter.fileSystem.root.fullPath + "/" + "osm" +"/" + xyz.z + "/" + xyz.x + "/" + xyz.y + finalUrl.substr(finalUrl.lastIndexOf("."));
    	
    	if (TileUtil.debug) {
    		console.log("<<<<<<<< ----- just returning a stitched path hoping it is there: " + tilePath + " for " + finalUrl);
    	}    	
    	//TODO: do we really have to worry about multiple requests before the db queries return? 
    	//      test for this case!
		//Add it immediately before we have confirmation that it has saved so that we do not download it multiple times
		//TileUtil.addTile(finalUrl, tilePath, "osm", xyz.z, xyz.x, xyz.y);
		//window.localStorage.setItem("tile_" + finalUrl, tilePath);		
	}
    
	//console.log("--- TileUtil.return tilePath: " + tilePath);
   
	return tilePath;
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


addTile: function(url, path, tileset, z, x, y) {

	// add to global.tiles table. if already exists, increment ref counter
	Arbiter.globalDatabase.transaction(function(tx){
		var insertTilesSql = "INSERT OR REPLACE INTO tiles (tileset, z, x, y, path, url, ref_counter)" +
							"VALUES (?, ?, ?, ?, ?, ?, " +  
							  "COALESCE(" +
							    "(SELECT ref_counter FROM tiles WHERE url=?), " +
							    "0) + 1);";
							    
	    console.log("SQL: "+ insertTilesSql);
		
		//TODO: does the second url get replaced as expected?
		tx.executeSql(insertTilesSql, [tileset, z, x, y, path, url, url], function(tx, res){
			
			//alert("inserted tile. id: " + res.insertId);
			Arbiter.currentProject.variablesDatabase.transaction(function(tx){
				var insertTileIdsSql = "INSERT INTO tileIds (id)" + "VALUES (?);";
				tx.executeSql(insertTileIdsSql, [res.insertId], function(tx, res){
					//alert("inserted in tileIds: " + res.insertId);
				});
			}, Arbiter.errorSql, function(){});	
				
		});
		
			
	}, Arbiter.errorSql, function(){});	

	// add id to project.variablesDatabase.tileIds
	// TODO: add entry to groutDatabase
}, 


/**
 * given a tileId, remove it from the project's tileIds table
 * then look in the global tiles table to decrement the reference counter
 * if counter is already only one, remove the entry from the global table
 * and delete the actual tile from the device. 
 */
removeTileById: function(id, txProject, txGlobal) {
	
	//TODO: use txProject, txGlobal if provided
	//window.localStorage.removeItem("tile_" + url);

	var sql = "(DELETE FROM tileIds WHERE id=?);";
	tx.executeSql(sql, [id], function(tx, res){
		console.log("--removed id from tileIds. id: " + id);
	});
	
	Arbiter.globalDatabase.transaction(function(tx){
		var selectTileSql = "(SELECT path, ref_counter FROM tiles WHERE id=?);";
		tx.executeSql(selectTileSql, [id], function(tx, res){
			// we should only have one tile for this url
			if (res.rows.length === 1){
				
				var tileEntry = rows.item(0);
				
				// if the counter is only at 1, we can delete the file from disk
				if (tileEntry.ref_counter === 1){
					//TODO: delete entry from tiles
					var deleteTileSql = "(DELETE FROM tiles WHERE id=?);";
					tx.executeSql(selectTileSql, [id], function(tx, res){
						// remove tile from disk
						//TODO: is tileEntry safe in this callback since it was from a loop item?
						//TODO: remove part of the path that is before the root dir??!!
						Arbiter.fileSystem.root.getFile(tileEntry.path, {create: false}, 
							function(fileEntry){
								fileEntry.remove(
									function(fileEntry){
										//TODO: is fileEntry.fullpath still valid?
										console.log("-- removed tile from disk: " + fileEntry.fullPath);
									},
									function(err){
										console.log("-- removed tile from disk: " + fileEntry.fullPath + ", err: " + err);
										alert("failed to delete tile from disk!");
									}
								);
							}, 
							function(err){
								console.log("get file from root failed. path: " + tileEntry.path);
								alert("err" + err);
							}
						);
					});
					
				} if (tileEntry.ref_counter > 1){
					// decrement ref_counter
					var sql = "(UPDATE tiles SET ref_counter=? WHERE id=?);";
					tx.executeSql(sql, [(tileEntry.ref_counter - 1), id], function(tx, res){
						console.log("-- decremented ref_counter to: " + (tileEntry.ref_counter - 1));
					});
					
				} else {
					alert("something is wrong!");
				}
				
			} else if (res.rows.length === 0){
				// should not happen
				alert("Error: tile id from tileIds not in tiles table");
			} else {
				// should not happen
				alert("Error: tiles has multiple entries for id");
			}
		});
	}, Arbiter.errorSql, function(){});	
	

	// TODO: remove entry from groutDatabase
}, 
/*
removeTileByUrl: function(url) {
	window.localStorage.removeItem("tile_" + url);
	
	//TODO: bring section from clear cache into this function 
	
	// decrement ref counter in global.tiles. if it hits 0, remove file from device
	// remove from project.variablesDatabase.tileIds
	// TODO: remove entry from groutDatabase
}, 
*/
dumpTableNames: function(database){
	console.log("---- TileUtil.dumpTable");
	database.transaction(function(tx){
		tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", [], function(tx, res){
			console.log(TileUtil.rowsToString(res.rows));
		});	
	}, Arbiter.errorSql, function(){
	});
},

dumpTableRows: function(database, tableName){
	console.log("---- TileUtil.dumpTableRows");
	database.transaction(function(tx){
		tx.executeSql("SELECT * FROM " + tableName + ";", [], function(tx, res){
			console.log(TileUtil.rowsToString(res.rows));
		});	
	}, Arbiter.errorSql, function(){
	});
},

rowsToString: function(rows) {
	var rowsStr = "rows.length: " + rows.length + "\n";
	for(var i = 0; i < rows.length; i++){
		var row = rows.item(i);
		var rowData = "";
		
		for(var x in row){
			if (rowData === "") {
				rowData = row[x];
			} else {
				rowData += ", " + row[x];
			}
		}
			  
		rowsStr = rowsStr + "{ " + rowData + " }" + "\n";
	}	
	
	return rowsStr;
}

};
