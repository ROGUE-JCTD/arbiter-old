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

    var zoomLevel = map.getZoomForExtent(bounds, true);
    
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

//TODO SM: test getURL
getURL: function(bounds) {
	
	var xyz = this.getXYZ(bounds);
    var url = this.url;
    if (OpenLayers.Util.isArray(url)) {
        var s = '' + xyz.x + xyz.y + xyz.z;
        url = this.selectUrl(s, url);
    }
    
    var finalUrl = OpenLayers.String.format(url, xyz);
    
    
    var tilePath = null;
    
    
    // assume we ave already saved the tile to the device and return what would be the path to it. 
	// this is the best we can do unless this call actually truly blocks the thread without hammering the cpu and running down battery of the device
	// TODO: might be able to do a synchronous ajax call with duration of pause in the loop but will probably fail when there is no connection
	//       consider other blocking calls like printing to console 
	tilePath = Arbiter.fileSystem.root.fullPath + "/" + "osm" +"/" + xyz.z + "/" + xyz.x + "/" + xyz.y + finalUrl.substr(finalUrl.lastIndexOf("."));

    if (TileUtil.debug) {
    	console.log("--- TileUtil.getURL.url: " + finalUrl + " tile: " + tilePath);
    }
	
    
    //BUGS:
    //  on project #2 nothing gets added to tilesId
    //  reference doesn't get incremented because of project two 
	
	if (typeof caching !== 'undefined') {
	
	
		//console.log("--- TileUtil chk 1");
	
		// have we cached the tile already? 
		Arbiter.globalDatabase.transaction(function(tx){
			//console.log("--- TileUtil chk 2");

			//---- have we cached the tile already?
			//TODO: bring everythign back for now for debugging we only need url though!
			var selectTileSql = "SELECT * FROM tiles WHERE url=?;";
			
			if (TileUtil.debug) {
				console.log("SQL: " + selectTileSql + "params: " + finalUrl);
			}
			
			tx.executeSql(selectTileSql, [finalUrl], function(tx, res){
				//console.log("--- TileUtil chk 3");
				
				if (TileUtil.debug) {
					console.log("getURL.res.rows.length: " + res.rows.length);
					console.log(TileUtil.rowsToString(res.rows));
				}
				
				// we have never cached the tile 
				if (res.rows.length === 0){
					
						
						// add the tile to databases immediately so that if multiple getURL calls come in for a given tile, 
						// we do not download the tile multiple times
			    		TileUtil.addTile(finalUrl, tilePath, "osm", xyz.z, xyz.x, xyz.y);
						
						var saveTileSuccess = function(url, path){
							if (typeof caching !== 'undefined' && typeof caching.counterCached !== 'undefined') {
								caching.counterCached += 1;
								
								if (TileUtil.debug) {
									var percent = (caching.counterCached/caching.counterEstimatedMax * 100);
									
									if (percent > 100) {
										percent = 100;
									}
	
									console.log("caching estimated percent complete: " + percent );
								}
							}
						};
						
						var saveTileError = function(url, path, error){
							console.log("========>> saveTileError filename: " + url + ", path: " + path);
							alert("failed to download file. todo.");
							//TODO: failed to download file and save to disk so just remove it from global.tiles and project.tileIds tables
							// if save failed, remove it. 
							//TileUtil.removeTile(url, path);
						};
						
						// write the tile to device
						tilePath = TileUtil.saveTile(finalUrl, "osm", xyz.z, xyz.x, xyz.y, saveTileSuccess, saveTileError);
	
						if (TileUtil.debug) {
							console.log("<<<<<<<< ------ cach tile: " + finalUrl + " to: " + tilePath);
						}
	
				} else if (res.rows.length === 1) {
					// we have cached the file! great... 

					// we have the file in the global.tiles table but we need to increment ref counter and also add it to this project.tileIds
		    		TileUtil.addTile(finalUrl, tilePath, "osm", xyz.z, xyz.x, xyz.y);
					
					// This would be path to tile retrieved from the database but since we are pre stitching the tilePath anyway
		    		// no real need to return this. 
					// tilePath =  res.rows.item(0).path;
				} else {
					// for some reason the tile have been cached under two separate entries!!
					console.log("====>> ERROR: TileUtil.getURL: Multiple Entries for tile " + TileUtil.rowsToString(res.rows));
					alert("TileUtil.getURL: Multiple Entries for tile! see console for details. count: " + res.rows.length);
				}					
			}, Arbiter.errorSql);	
			
		}, Arbiter.errorSql, function(){});	
		
	} else {
		//TODO: if not chached, if we have connection, just return URL aka finalUrl
		//      so that if they have not cached anything, they can still browse around
	}
	
	if (TileUtil.debug) {
		console.log("<<<<<<<< ------ returning tile: " + tilePath + " for: " + finalUrl);
	}
   
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

addTile : function(url, path, tileset, z, x, y) {
	
    if (TileUtil.debug) {
    	console.log("---- TileUtil.addTile");
    }

	Arbiter.globalDatabase.transaction(function(tx) {

		var insertTilesSql = "SELECT id, ref_counter FROM tiles WHERE url=?;";

		tx.executeSql(insertTilesSql, [ url ], function(tx, res) {

			console.log("tiles items with url: " + url + " items: " + TileUtil.rowsToString(res.rows));

			var resTiles = res;

			if (res.rows.length === 0) {
				// alert("inserted tile. id: " + res.insertId);
				Arbiter.globalDatabase.transaction(
					function(tx) {
						var statement = "INSERT INTO tiles (tileset, z, x, y, path, url, ref_counter) VALUES (?, ?, ?, ?, ?, ?, ?);";
						tx.executeSql(statement, [ tileset, z, x, y, path, url, 1 ], function(tx, res) {
							
							//TODO: why does the first insert return id null??
							console.log("inserted new url in tiles. res.insertId: " + res.insertId);
	
						    TileUtil.insertIntoTileIds(res.insertId);
						});
					}, Arbiter.errorSql, function() {
				});

			} else if (res.rows.length === 1) {
				console.log("chk1");
				console.log(resTiles);
				console.log("chk2");

				console.log("found tile in global.tiles. TileUtil.rowsToString(resTiles.rows): " + TileUtil.rowsToString(resTiles.rows));
				console.log("found tile in global.tiles. (resTiles.rows[0].ref_counter + 1 ): " + (resTiles.rows.item(0).ref_counter + 1));

				Arbiter.globalDatabase.transaction(function(tx) {

					console.log("chk3");
					// var statement = "INSERT INTO tiles (tileset, z, x, y,
					// path, url, ref_counter) VALUES (?, ?, ?, ?, ?, ?,
					// ?);";
					var statement = "UPDATE tiles SET ref_counter=? WHERE url=?;";
					tx.executeSql(statement, [ (resTiles.rows.item(0).ref_counter + 1), url ], function(tx, res) {
						console.log("chk4");

						console.log("updated tiles. for url : " + url);

						Arbiter.currentProject.variablesDatabase.transaction(
							function(tx) {
							    TileUtil.insertIntoTileIds(resTiles.rows.item(0).id);
							}, Arbiter.errorSql, function() {
						});

					});
				}, Arbiter.errorSql, function() {
				});

			} else {
				console.log("TileUtil.addTile rows length not 0 not 1: " + TileUtil.rowsToString(res.rows))
				alert("tiles has duplicate entry for a given url. see console");
			}

		}, Arbiter.errorSql);

	}, Arbiter.errorSql, function() {
	});

}, 

//BUG: it always inserts! either not supported in sqlite or plugin bug
addTileReplaceBug: function(url, path, tileset, z, x, y) {

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
		    TileUtil.insertIntoTileIds(res.insertId);
		}, Arbiter.errorSql);
		
			
	}, Arbiter.errorSql, function(){});	

	// add id to project.variablesDatabase.tileIds
	// TODO: add entry to groutDatabase
}, 

//clear entries in db, removed tiles from device
clearCache : function(tileset, successCallback, errorCallback) {
	if (TileUtil.debug) {
		console.log("---- TileUtil.clearCache");
	}	
	
	console.log("chk 1");
	
	//alert("inserted tile. id: " + res.insertId);
	Arbiter.currentProject.variablesDatabase.transaction(function(tx){
		console.log("chk 2");
		var sql = "SELECT id FROM tileIds;";
		tx.executeSql(sql, [], function(tx, res){
			console.log("chk 3");
			
			if (res.rows.length > 0) {
			
				var removeCounter = 0;
				
				var removeCounterCallback = function() {
					removeCounter += 1;
					console.log("removeCounterCallback: " + removeCounter + " row.length: " + res.rows.length);
					
					if (removeCounter === res.rows.length) {
						console.log("removeCounterCallback, counter met!");
						TileUtil.deleteTileIds();
						if (successCallback){
							successCallback();
						}
					}
				};
				
				for(var i = 0; i < res.rows.length; i++){
					console.log("chk 4");
	
					var tileId = res.rows.item(i).id;
					
					TileUtil.removeTileById(tileId, removeCounterCallback);
					console.log("chk 5");
				}
			} else {
				if (successCallback){
					successCallback();
				}				
			}

		}, Arbiter.errorSql);
	}, Arbiter.errorSql, function(){});		
}, 

deleteTileIds: function(){
    if (TileUtil.debug) {
    	console.log("---- TileUtil.deleteTileIds");
    }

	// Remove everything from tileIds table
	Arbiter.currentProject.variablesDatabase.transaction(function(tx){
		var statement = "DELETE FROM tileIds;";
		tx.executeSql(statement, [], function(tx, res){
			console.log("---- TileUtil.deleteTileIds done");
		}, Arbiter.errorSql);					
	}, Arbiter.errorSql, function(){});	
},

insertIntoTileIds: function(id) {
    if (TileUtil.debug) {
    	console.log("---- TileUtil.addToTileIds. id: " + id);
    }
	
	Arbiter.currentProject.variablesDatabase.transaction(function(tx) {
		var statement = "INSERT INTO tileIds (id) VALUES (?);";
		tx.executeSql(statement, [id], function(tx, res) {
			console.log("inserted in tileIds. id: " + id);
		}, Arbiter.errorSql);
	}, Arbiter.errorSql, function() {
	});
},

/**
 * given a tileId, remove it from the project's tileIds table
 * then look in the global tiles table to decrement the reference counter
 * if counter is already only one, remove the entry from the global table
 * and delete the actual tile from the device. 
 */
removeTileById: function(id, successCallback, errorCallback, txProject, txGlobal) {
    if (TileUtil.debug) {
    	console.log("---- TileUtil.removeTileById: " + id);
    }
	
	//TODO: use txProject, txGlobal if provided
	
	Arbiter.globalDatabase.transaction(function(tx){
		var statement = "SELECT id, url, path, ref_counter FROM tiles WHERE id=?;";
		tx.executeSql(statement, [id], function(tx, res){
			
		    if (TileUtil.debug) {
				console.log("TileUtil.removeTileById. rows to remove:");
				console.log(TileUtil.rowsToString(res.rows));
		    }

			// we should only have one tile for this url
			if (res.rows.length === 1){

				var tileEntry = res.rows.item(0);
				
				// if the counter is only at 1, we can delete the file from disk
				if (tileEntry.ref_counter === 1){

					Arbiter.globalDatabase.transaction(function(tx){

						var statement = "DELETE FROM tiles WHERE id=?;";
						tx.executeSql(statement, [id], function(tx, res){
	
							// remove tile from disk
							Arbiter.fileSystem.root.getFile(tileEntry.path, {create: false},
								function(fileEntry){
									fileEntry.remove(
										function(fileEntry){
	
										    if (TileUtil.debug) {
										    	console.log("-- TileUtil.removeTileById. removed tile from disk: " + tileEntry.path);
										    }
											
											if (successCallback){
												successCallback();
											}
										},
										function(err){
											console.log("====> Error: TileUtil.removeTileById. Error removing tile from disk: " + tileEntry.path + ", err: " + err);
											alert("failed to delete tile from disk!");
										}
									);
								}, 
								function(err){
									console.log("get file from root failed. path: " + tileEntry.path);
									alert("err" + err);
								}
							);
						}, Arbiter.errorSql);
					}, Arbiter.errorSql, function(){});							
					
				} else if (tileEntry.ref_counter > 1){
					Arbiter.globalDatabase.transaction(function(tx){
						// decrement ref_counter
						var statement = "UPDATE tiles SET ref_counter=? WHERE id=?;";
						tx.executeSql(statement, [(tileEntry.ref_counter - 1), id], function(tx, res){
						    
							if (TileUtil.debug) {
						    	console.log("-- decremented ref_counter to: " + (tileEntry.ref_counter - 1));
						    }
						    
							if (successCallback){
								successCallback();
							}
						}, Arbiter.errorSql);
					}, Arbiter.errorSql, function(){});	
					
				} else {
					alert("Error: tileEntry.ref_counter <= 0");
				}
				
			} else if (res.rows.length === 0){
				// should not happen
				alert("Error: tile id from tileIds not in tiles table");
			} else {
				// should not happen
				alert("Error: tiles has multiple entries for id");
			}
		}, Arbiter.errorSql);
	}, Arbiter.errorSql, function(){});	
	

}, 

dumpTableNames: function(database){
	console.log("---- TileUtil.dumpTable");
	database.transaction(function(tx){
		tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", [], function(tx, res){
			console.log(TileUtil.rowsToString(res.rows));
		}, Arbiter.errorSql);	
	}, Arbiter.errorSql, function(){
	});
},

dumpTableRows: function(database, tableName){
	console.log("---- TileUtil.dumpTableRows");
	database.transaction(function(tx){
		tx.executeSql("SELECT * FROM " + tableName + ";", [], function(tx, res){
			console.log(TileUtil.rowsToString(res.rows));
		}, Arbiter.errorSql);	
	}, Arbiter.errorSql, function(){
	});
},

rowsToString: function(rows) {
	
	for(var x in row){
		if(x != "id" && x != "fid" && x != geomName){
			feature.attributes[x] = row[x];
		}
	}	
	
	var rowsStr = "rows.length: " + rows.length + "\n";
	for(var i = 0; i < rows.length; i++){
		var row = rows.item(i);
		var rowData = "";
		
		for(var x in row){
			if (rowData === "") {
				rowData = x + "=" + row[x];
			} else {
				rowData += ", " + x + "=" + row[x];
			}
		}
			  
		rowsStr = rowsStr + "{ " + rowData + " }" + "\n";
	}	
	
	return rowsStr;
}

};
