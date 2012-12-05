var TileUtil = {

debug: false,
debugProgress: false,
cacheTilesTest1Couter: 0,
getURLCounter : 0,

		
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
					function(err){
						Arbiter.error("dumpFiles.exception", err);
					}
				);
			} catch (e) {
				Arbiter.error("dumpFiles.exception", e);
			}
		}, 
		function(err) {
			Arbiter.error("failed to get fs (fileSystem)", err);
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
        if (TileUtil.debug){
        	console.log("-----<< Will cache " + widthInTiles * widthInTiles + " tiles for zoom level: " + zoomLevel + ", widthInTiles: " + widthInTiles);
        }
        
    	zoomLevel += 1;
    }
    
    if (TileUtil.debug || TileUtil.debugProgress){
    	console.log("=====<< simple method Will cache " + totalTiles + " tiles for all " + (layer.numZoomLevels - map.getZoom()) + " zoom levels");
    }
    
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


// start caching the cacheTile
startCachingTiles: function(successCallback) {
	console.log("---- startCachingTiles");
	
	if (typeof caching !== 'undefined') {
		Arbiter.warning("Tile Caching already in progress. Aborting new request");
		return;
	}

	var layer = map.baseLayer;

	caching = {
		// extent before we start caching	
		extentOriginal: map.getExtent(),
		// extent that we should use as starting point of caching
		extent: Arbiter.currentProject.aoi,
		buffer: layer.buffer,
		layer: layer,
		counterCached: 0,
		counterCacheInProgress: 0,
		counterCacheInProgressWaitAttempt: 0,
		counterEstimatedMax: TileUtil.countTilesInBounds(Arbiter.currentProject.aoi),
		successCallback: successCallback, 
		startZoom: -1,
		cachedUrls: {}
	};

	if (TileUtil.debug){
		console.log("---- startCachingTiles. counterEstimatedMax: " + caching.counterEstimatedMax);
	}

	// TODO: zoom to a level other than caching.extent
	// make sure the next setCenter triggers a load
	caching.startZoom = map.getZoomForExtent(caching.extent, true);
	map.zoomTo(caching.startZoom === map.numZoomLevels ? caching.startZoom - 1 : caching.startZoom + 1);

	layer.events.register("loadend", null, TileUtil.cacheTilesForCurrentZoom);

	// start caching
	map.zoomToExtent(caching.extent, true);
},


// cacheTile a zoom level based on the extent at the time startCachingTiles was
// called
cacheTilesForCurrentZoom: function() {
    var layer = caching.layer;
    var tileWidth = layer.tileSize.w;
    var nextZoom = map.getZoom() + 1;

    if (nextZoom === layer.numZoomLevels) {
    	console.log("caching.startZoom: " + caching.startZoom + ", nextZoom: " + nextZoom + ", layer.numZoomLevels: " + layer.numZoomLevels);
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
stopCachingTiles: function() {
	// we're done - restore previous settings
	caching.layer.events.unregister("loadend", null, TileUtil.cacheTilesForCurrentZoom);
	caching.layer.buffer = caching.buffer;
    map.zoomToExtent(caching.extentOriginal, true);
    
    console.log("---- stopCachingTiles");
    console.log(caching);
    
    var cachingComplete = function(){
        console.log("---- caching complete!");
        console.log(caching);

        var callback = caching.successCallback;
        
        // keep for debugging
        cachingLast = caching;
    	caching = undefined;

    	// Note: caching var is removed before servicing call back as a issue in callback will
    	// leave caching hanging around which will have serious implications 
		if (callback){
			callback();
		}
    	
		console.log("---- finalized last line of TileUtil.cacheTiles!");
    };

	if (caching.counterCacheInProgress === 0){
		cachingComplete();
	} else {
       console.log("***** caching.counterCacheInProgress is not ZERO: " + caching.counterCacheInProgress);
        
    	var checkCachingStatus = function(){
    		caching.counterCacheInProgressWaitAttempt += 1;
    		console.log("---[ waiting for caching.counterCacheInProgress to get 0:  " + caching.counterCacheInProgress + ", waiting attempts: " + caching.counterCacheInProgressWaitAttempt );
    		
    		if (caching.counterCacheInProgress === 0){
    			console.log("************************* counterCacheInProgress === 0 **********************. not setting timeout!");
    			//clearTimeout(caching.counterCacheInProgressWaitTimer);
    			cachingComplete();
    			//alert("BINGO!");
    		} else {
    	    	// wait one second to see if the tiles finish caching. 
    			caching.counterCacheInProgressWaitTimer = setTimeout(checkCachingStatus, 1000);
    		}
    	};
    	
    	checkCachingStatus();
    }
},

cacheTiles: function(successCallback, errorCallback){
	
	if (typeof caching !== 'undefined') {
		Arbiter.warning("Tile Caching already in progress. Aborting new request");
		return;
	} 
	
	
	TileUtil.getURLCounter = 0;
	Arbiter.ShowCachingTilesMenu();

	
	TileUtil.clearCache("osm", function(){
		
		if (TileUtil.cacheTilesTest1Couter > 0) {
			console.log("~~~~ cacheTiles. done clear cache. starting testTilesTableIsEmpty MAKE sure there is only one project in arbiter!");
			TileUtil.testTilesTableIsEmpty(
				function(){
					console.log("---- cacheTiles.clearCache: success no tiles in Tiles table");
					
					// once all the cache for this project is cleared, start caching again. 
					TileUtil.startCachingTiles(
						function(){
							console.log("~~~~ done caching");
							Arbiter.HideCachingTilesMenu();
							
							if (successCallback){
								successCallback();
							}
						}
					);
				},
				function(){
					TileUtil.dumpTilesTable();
					Arbiter.error("----[ TEST FAILED: testTilesTableIsEmpty cacheTiles.clearCache: failed! Tiles Table not empty. just dumped tilestable");
					Arbiter.HideCachingTilesMenu();
	
					if (errorCallback){
						errorCallback();
					}
				}
			);
		} else {
			console.log("~~~~ cacheTiles, done clearing clearing cache. starting caching");
			// once all the cache for this project is cleared, start caching again. 
			TileUtil.startCachingTiles(
				function(){
					console.log("~~~~ done caching");
					Arbiter.HideCachingTilesMenu();
					
					if (successCallback){
						successCallback();
					}
				}
			);
		}
	});
	
	//Original
/*
	TileUtil.clearCache("osm", function(){
		console.log("~~~~ done clearing clearing cache");
		// once all the cache for this project is cleared, start caching again. 
		TileUtil.startCachingTiles(
			function(){
				console.log("~~~~ done caching");
				Arbiter.HideCachingTilesMenu();
				
				//console.log("######## tiles with ref count of 2");
				//TileUtil.dumpTilesWithRefCount(2);
				
				if (successCallback){
					successCallback();
				}
			}
		);
	});
*/
},

testCacheTilesRepeatStart: function(millisec, maxRepeat){
	
	var onTimeout = function(){
		TileUtil.cacheTilesTest1Couter += 1;
		console.log("---[ cacheTilesTest1Couter: " + TileUtil.cacheTilesTest1Couter );
		
		if (typeof maxRepeat !== 'undefined') { 
			if (TileUtil.cacheTilesTest1Couter > maxRepeat) {
				testCacheTilesRepeatStop();
				alert("testCacheTilesRepeat completed");
			}
		}

		TileUtil.cacheTiles(null, function(){ 
			console.log("stoping test, testCacheTilesRepeatStop");
			TileUtil.testCacheTilesRepeatStop();
		});
	};
	
	cacheTilesTest1Timer = setInterval(onTimeout, millisec);
},

testCacheTilesRepeatStop: function(){
	clearTimeout(cacheTilesTest1Timer);
},

// make sure all ids in tileIds are in tiles table
testTileIdsTableIntegrity: function(){
},

// make sure entries in tiles table exist on disk
testTilesTableIntegrity: function(){
},

// make sure there are no entries in Tiles table
testTilesTableIsEmpty: function(_success, _error){
	Cordova.transaction(
		Arbiter.globalDatabase,
		"SELECT * FROM tiles;", 
		[], 
		function(tx, res){
			if (res.rows.length == 0){
				if (_success){
					_success();
				}
			} else {
				if (_error){
					_error();
				}
			}
		},
		function(e1, e2){
			Arbiter.error("testTilesTableIsEmpty. ", e1, e2);
		}
	);
},

// count how many png files are actually on file system
testPngTileCount: function(){
},



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
    	TileUtil.getURLCounter += 1;
    	console.log("--- TileUtil.getURL, counter: " + TileUtil.getURLCounter + ", url: " + finalUrl + " tile: " + tilePath);
    }
	
 
    // only attempt to cache if we are:
    // - in caching mode
    // - this cache pass has not seen this url yet. sometimes openlayers getsURL multiple times!  
 	if (typeof caching !== 'undefined') {
 		if ((typeof caching.cachedUrls[finalUrl]) === 'undefined') { 
 			//TODO: consider  if it fails?? fet to false again?
	 		caching.cachedUrls[finalUrl] = true;

	 		
	 		// track that we are starting to save this tile so that incase the save takes along time in rare cases, 
	 		// we can detect that caching is not really complete yet. once we save the file or the attempt fails for ANY reason, 
	 		// we'll decrement the counter. 
	 		caching.counterCacheInProgress += 1;	 		
	 		
			// have we cached the tile already? 
			Arbiter.globalDatabase.transaction(function(tx){
				//---- have we cached the tile already?
				//TODO: bring everythign back for now for debugging we only need url though!
				var selectTileSql = "SELECT * FROM tiles WHERE url=?;";
				
				if (TileUtil.debug) {
					console.log("SQL: " + selectTileSql + "params: " + finalUrl);
				}
				
				tx.executeSql(selectTileSql, [finalUrl], function(tx, res){
					
					if (TileUtil.debug) {
						console.log("getURL.res.rows.length: " + res.rows.length);
						console.log(TileUtil.rowsToString(res.rows));
					}
					
					// we have never cached the tile 
					if (res.rows.length === 0){
						
						var addTileCallback = function(){
				    		//TODO: save tile should rely on add tile!!! and if add tile fails, the whole thing fail?
				    		
							var saveTileSuccess = function(url, path){
								caching.counterCacheInProgress -= 1;
								
								if (typeof caching !== 'undefined') {
									caching.counterCached += 1;
									var percent = Math.round((caching.counterCached/caching.counterEstimatedMax * 100));
									
									if (percent > 100) {
										percent = 100;
									}
									
									$("#cachingPercentComplete").html("<center>Cached " + percent + "%</center>");
									
									if (TileUtil.debugProgress) {
										console.log("caching estimated percent complete: " + percent + ". counterCached: " + caching.counterCached + ", counterEstimatedMax: " + caching.counterEstimatedMax);
									}
								} else {
									alert("ya yo ma!");
								}
							};
							
							var saveTileError = function(url, path, err){
								caching.counterCacheInProgress -= 1;
								Arbiter.error("saveTileError filename: " + url + ", path: " + path, err);
								//TODO: failed to download file and save to disk so just remove it from global.tiles and project.tileIds tables
								//TileUtil.removeTile(url, path);
							};
							
							// write the tile to device
							tilePath = TileUtil.saveTile(finalUrl, "osm", xyz.z, xyz.x, xyz.y, saveTileSuccess, saveTileError);
						};
							
						// add the tile to databases immediately so that if multiple getURL calls come in for a given tile, 
						// we do not download the tile multiple times
			    		TileUtil.addTile(finalUrl, tilePath, "osm", xyz.z, xyz.x, xyz.y, addTileCallback);
		
					} else if (res.rows.length === 1) {
						// we have cached the file! great... 
						
						var addTileCallback = function(){
							caching.counterCacheInProgress -= 1;
						};
	
						//TODO: if tile is already in tileIds, then dont add it. 
						
						//NOTE: get rid of tile ids in general and just store it as a json array in projectKeyValueDatabase?
						// we have the file in the global.tiles table but we need to increment ref counter and also add it to this project.tileIds
			    		TileUtil.addTile(finalUrl, tilePath, "osm", xyz.z, xyz.x, xyz.y, addTileCallback);
						
						// This would be path to tile retrieved from the database but since we are pre stitching the tilePath anyway
			    		// no real need to return this. 
						// tilePath =  res.rows.item(0).path;
					} else {
						// for some reason the tile have been cached under two separate entries!!
						console.log("====>> ERROR: TileUtil.getURL: Multiple Entries for tile " + TileUtil.rowsToString(res.rows));
						Arbiter.error("TileUtil.getURL: Multiple Entries for tile! see console for details. count: " + res.rows.length);
					}					
				}, function(e1, e2) {
					Arbiter.error("chk27", e1, e2);
				});	
			}, function(e1, e2) {
				Arbiter.error("chk28", e1, e2);
			});
 		} else {
 			// Arbiter.warning("saved trying to cache a url more than once this session: " + finalUrl);
 		}
		
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
								function(err) {
									console.log("download error source " + err.source);
									console.log("download error target " + err.target);
									console.log("upload error code" + err.code);
									
									Arbiter.error("Failed download or save file to: " + filePath, err);
									
									if (errorCallback){
										errorCallback(fileUrl, filePath, err);
									}
								}
							);
						}, function(e1, e2) {
							if (errorCallback){
								errorCallback(e1, e2);
							}
							Arbiter.error("chk29", e1, e2);
						}
					);
				}, function(e1, e2) {
					if (errorCallback){
						errorCallback(e1, e2);
					}
					Arbiter.error("chk30", e1, e2);
				}
			);
		}, function(e1, e2) {
			if (errorCallback){
				errorCallback(e1, e2);
			}
			Arbiter.error("chk31", e1, e2);
		}
	);

	var filePath2 = Arbiter.fileSystem.root.fullPath + "/" + tileset +"/" + z + "/" + x + "/" + y + extention;
	
	// NOTE: file may not be ready for reading yet since write operation is async
	return filePath2;
},

addTile : function(url, path, tileset, z, x, y, successCallback) {
	
    if (TileUtil.debug) {
    	console.log("---- TileUtil.addTile");
    }

    //TODO: the caller of this method already has the ref count. support passing it in as an optimization to reduce one extra request
	Arbiter.globalDatabase.transaction(function(tx) {

		var insertTilesSql = "SELECT id, ref_counter FROM tiles WHERE url=?;";

		tx.executeSql(insertTilesSql, [ url ], function(tx, res) {

			if (TileUtil.debug) {
				console.log("tiles items with url: " + url + " items: " + TileUtil.rowsToString(res.rows));
			}

			var resTiles = res;

			if (res.rows.length === 0) {
				// alert("inserted tile. id: " + res.insertId);
				Arbiter.globalDatabase.transaction(
					function(tx) {
						var statement = "INSERT INTO tiles (tileset, z, x, y, path, url, ref_counter) VALUES (?, ?, ?, ?, ?, ?, ?);";
						tx.executeSql(statement, [ tileset, z, x, y, path, url, 1 ], function(tx, res) {
							
							//HACK WORKAROUND: 	the first time something is inserted into a table
							// 					the inserterId comes back null for some reason. 
							//					catch it and assume it was id of 1
							if (res.insertId == null){
								res.insertId = 1;
								//Arbiter.warning("@@@@@@ caught res.insertId == null inserintg into tiles. using 1 as workaround");
							}
							
						    TileUtil.insertIntoTileIds(res.insertId, successCallback);

						    if (TileUtil.debug) {
								console.log("inserted new url in tiles. res.insertId: " + res.insertId);
							}
						}, function(e1, e2) {
							Arbiter.error("chk1", e1, e2);
						});
					}, function(e1, e2) {
						Arbiter.error("chk2", e1, e2);
					});

			} else if (res.rows.length === 1) {
				//TEST NOTE only for testing single project
				//Arbiter.warning("only a warning if arbiter only has a single project cached. about to increment existing tiles refcounter for id: " + resTiles.rows.item(0).id);
				
				if (TileUtil.debug) {
					console.log("found tile in global.tiles. TileUtil.rowsToString(resTiles.rows): " + TileUtil.rowsToString(resTiles.rows));
					console.log("found tile in global.tiles. (resTiles.rows[0].ref_counter + 1 ): " + (resTiles.rows.item(0).ref_counter + 1));
				}

				Arbiter.globalDatabase.transaction(function(tx) {

					var statement = "UPDATE tiles SET ref_counter=? WHERE url=?;";
					tx.executeSql(statement, [ (resTiles.rows.item(0).ref_counter + 1), url ], function(tx, res) {
						
						//TEST NOTE message important when debugging single projects
						//console.log("!!!!!!!!!!!!!!! only a warning if arbiter only has a single project cached. calling insertIntoTileIds for an Existing tile in tileId: " + resTiles.rows.item(0).id);
					    
						TileUtil.insertIntoTileIds(resTiles.rows.item(0).id, successCallback);

						if (TileUtil.debug) {
							console.log("updated tiles. for url : " + url);
						}
					}, function(e1, e2) {
						Arbiter.error("chk3", e1, e2);
					});
				}, function(e1, e2) {
					Arbiter.error("chk4", e1, e2);
				});

			} else {
				console.log("TileUtil.addTile rows length not 0 not 1: " + TileUtil.rowsToString(res.rows))
				Arbiter.error("tiles has duplicate entry for a given url. see console");
			}
		}, function(e1, e2) {
			Arbiter.error("chk5", e1, e2);
		});
	}, function(e1, e2) {
		Arbiter.error("chk6", e1, e2);
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
		}, Arbiter.error);
	}, Arbiter.error);	

	// add id to project.variablesDatabase.tileIds
	// TODO: add entry to groutDatabase
}, 

//clear entries in db, removed tiles from device
clearCache : function(tileset, successCallback, vDb) {
	if (TileUtil.debug) {
		console.log("---- TileUtil.clearCache");
	}	
	
	var op = function(tx){
		var sql = "SELECT id FROM tileIds;";
		tx.executeSql(sql, [], function(tx, res){
			
			if (res.rows.length > 0) {
			
				var removeCounter = 0;
				
				var removeCounterCallback = function() {
					removeCounter += 1;
					var percent = Math.round(removeCounter/res.rows.length * 100);
					$("#cachingPercentComplete").html("<center>Removed " + percent + "%</center>");

					if (TileUtil.debug) {
						console.log("removeCounter: " + removeCounter + ", percent cleared: " + percent);
					}
					
					if (removeCounter === res.rows.length) {
						TileUtil.deleteTileIdsEntries(vDb);
						if (successCallback){
							successCallback();
						}
					}
				};
				
				for(var i = 0; i < res.rows.length; i++){
					var tileId = res.rows.item(i).id;
					TileUtil.removeTileById(tileId, removeCounterCallback);
				}
			} else {
				if (successCallback){
					successCallback();
				}				
			}

		}, function(e1, e2) {
			Arbiter.error("chk7", e1, e2);
		});
	};
	
	if (!vDb){
		vDb = Arbiter.currentProject.variablesDatabase;
	}
		
	//alert("inserted tile. id: " + res.insertId);
	vDb.transaction(op, function(e1, e2) {
		Arbiter.error("chk8", e1, e2);
	});		
}, 

deleteTileIdsEntries: function(vDb){
	console.log("---- TileUtil.deleteTileIdsEntries");
	
	if (!vDb){
		vDb = Arbiter.currentProject.variablesDatabase;
	}
		
	// Remove everything from tileIds table
	vDb.transaction(function(tx){
		var statement = "DELETE FROM tileIds;";
		tx.executeSql(statement, [], function(tx, res){
			if (TileUtil.debug) {
				console.log("---- TileUtil.deleteTileIdsEntries done");
			}
		}, function(e1, e2) {
			Arbiter.error("chk9", e1, e2);
		});					
	}, function(e1, e2) {
		Arbiter.error("chk10", e1, e2);
	});	
},

deleteTilesEntries: function(){
	console.log("---- TileUtil.deleteTileIdsEntries");

	// Remove everything from tiles table
	Cordova.transaction(
		Arbiter.globalDatabase,
		"DELETE FROM tiles;",
		[], 
		function(tx, res){
			if (TileUtil.debug) {
				console.log("---- TileUtil.deleteTilesEntries done");
			}
		}, 
		function(e1, e2) {
			Arbiter.error("chk101", e1, e2);
		}					
	);
},

deleteAllTileTableEntriesAndTheirPngFiles: function(){
	console.log("---- TileUtil.deleteAllTileTableEntriesAndTheirPngFiles");

	Cordova.transaction(
		Arbiter.globalDatabase,
		"SELECT * FROM tiles;", 
		[], 
		function(tx, res){
			console.log("deleting pngs mapped to entries. count:" + res.rows.length);
			
			for(var i = 0; i < res.rows.length; i++){
				var row = res.rows.item(i);
				TileUtil.removeTileFromDevice(row.path, row.id, null, function(){
					Arbiter.error("chk100");
				});
				
				TileUtil.deleteTilesEntries();
			}	
		},
		function(e1, e2){
			Arbiter.error("deleteAllTileTableEntriesAndTheirPngFiles. ", e1, e2);
		}
	);
},

insertIntoTileIds: function(id, successCallback) {
    if (TileUtil.debug) {
    	console.log("---- TileUtil.addToTileIds. id: " + id);
    }
    
    //var idsBeforeTx = TileUtil.tableToString(Arbiter.currentProject.variablesDatabase, "tileIds");
    //console.log("dumping before inserting id into tileIds. id: " + id);
    //TileUtil.dumpTileIds();
    
	Arbiter.currentProject.variablesDatabase.transaction(function(tx) {
		
		//var statement = "INSERT tileIds (cName) SELECT DISTINCT Name FROM CompResults cr WHERE NOT EXISTS (SELECT * FROM Compettrr c WHERE cr.Name = c.cName)";
		var statement = "INSERT INTO tileIds (id) SELECT ? WHERE NOT EXISTS (SELECT id FROM tileIds WHERE id = ?);";
		
		//var statement = "INSERT INTO tileIds (id) VALUES (?);";
		tx.executeSql(statement, [id, id], function(tx, res) {
			if (TileUtil.debug) {
				console.log("inserted in tileIds. id: " + id);
			}
			
			if (successCallback){
				successCallback();
			}
		}, function(e1, e2) {
			console.log("dumping after error for id: " + id);
			//TileUtil.dumpTileIds();
			console.log("CHK: " + statement + ": " + id);
			Arbiter.error("chk11", e1, e2);
		});
	}, function(e1, e2) {
		Arbiter.error("chk12", e1, e2);
	});
},

removeTileFromDevice: function(path, id, successCallback, errorCallback){
	// remove tile from disk
	Arbiter.fileSystem.root.getFile(path, {create: false},
		function(fileEntry){
			fileEntry.remove(
				function(fileEntry){
	
				    if (TileUtil.debug) {
				    	console.log("-- TileUtil.removeTileById. removed tile from disk . tiles.id: " + id + ", path: " + path);
				    }
					
					if (successCallback){
						successCallback();
					}
				},
				function(err){
					Arbiter.error("failed to delete tile from disk. tiles.id: " + id + ", path: " + path, err);
				}
			);
		}, 
		function(err){
			Arbiter.warning("get file from root failed. will assume success. tiles.id: " + id + ", path: " + path, err);
	
			if (successCallback){
				successCallback();
			}
		}
	);
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
	
							TileUtil.removeTileFromDevice(tileEntry.path, id, successCallback, errorCallback);
							
						}, function(e1, e2) {
							Arbiter.error("chk13", e1, e2);
						});
					}, function(e1, e2) {
						Arbiter.error("chk14", e1, e2);
					});							
					
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
						}, function(e1, e2) {
							Arbiter.error("chk15", e1, e2);
						});
					}, function(e1, e2) {
						Arbiter.error("chk16", e1, e2);
					});	
					
				} else {
					Arbiter.error("Error: tileEntry.ref_counter <= 0 for id: " + id);
				}
				
			} else if (res.rows.length === 0){
				// should not happen
				Arbiter.warning("tile id from tileIds not in tiles table. Will return succes so the tileIds table gets flushed anyway. id: " + id);
				if (successCallback){
					successCallback();
				}
			} else {
				// should not happen
				Arbiter.error("tiles table has multiple entries for id: " + id);
			}
		}, function(e1, e2) {
			Arbiter.error("chk17", e1, e2);
		});
	}, function(e1, e2) {
		Arbiter.error("chk18", e1, e2);
	});	
	

}, 

dumpTableNames: function(database){
	console.log("---- TileUtil.dumpTable");
	database.transaction(function(tx){
		tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", [], function(tx, res){
			console.log(TileUtil.rowsToString(res.rows));
		}, function(e1, e2) {
			Arbiter.error("chk19", e1, e2);
		});	
	}, function(e1, e2) {
		Arbiter.error("chk20", e1, e2);
	});
},
// TODO: neds a call baclk instead
//tableToString: function(database, tableName){
//	console.log("---- TileUtil.tableToString");
//	var str = "";
//	database.transaction(function(tx){
//		tx.executeSql("SELECT * FROM " + tableName + ";", [], function(tx, res){
//			str = TileUtil.rowsToString(res.rows);
//		}, function(e1, e2) {
//			alert("chk21");
//			Arbiter.error(e1, e2);
//		});	
//	}, function(e1, e2) {
//		alert("chk22");
//		Arbiter.error(e1, e2);
//	});
//	
//	return str;
//},

dumpTableRows: function(database, tableName){
	console.log("---- TileUtil.dumpTableRows");
	database.transaction(function(tx){
		tx.executeSql("SELECT * FROM " + tableName + ";", [], function(tx, res){
			console.log(TileUtil.rowsToString(res.rows));
		}, function(e1, e2) {
			Arbiter.error("chk21", e1, e2);
		});	
	}, function(e1, e2) {
		Arbiter.error("chk22", e1, e2);
	});
},

rowsToString: function(rows) {
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
},

dumpTilesTable: function(){
	TileUtil.dumpTableRows(Arbiter.globalDatabase, "tiles");
},

dumpTilesWithRefCount: function(count){
	console.log("---- TileUtil.dumpTilesWithRefCount");
	Arbiter.globalDatabase.transaction(
		function(tx){
			tx.executeSql(
				"SELECT * FROM tiles WHERE ref_counter=?;", 
				[count], 
				function(tx, res){
					console.log(TileUtil.rowsToString(res.rows));
				}, 
				function(e1, e2) {
					Arbiter.error("chk23", e1, e2);
				}
			);	
		}, 
		function(e1, e2) {
			Arbiter.error("chk24", e1, e2);
		}
	);
},

dumpTileIds: function(){
	console.log("---- TileUtil.dumpTileIds");
	Arbiter.currentProject.variablesDatabase.transaction(
		function(tx){
			tx.executeSql(
				"SELECT * FROM tileIds;", 
				[], 
				function(tx, res){
					console.log(TileUtil.rowsToString(res.rows));
				}, 
				function(e1, e2) {
					Arbiter.error("chk25", e1, e2);
				}
			);	
		}, 
		function(e1, e2) {
			Arbiter.error("chk26", e1, e2);
		}
	);
}

};
