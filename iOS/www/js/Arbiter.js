
/* ============================ *
 *   	    Projections
 * ============================ */
var WGS84;
var WGS84_Google_Mercator;

/* ============================ *
 * 			   Map
 * ============================ */
var map;

/* ============================ *
 * 		   Symbolizers
 * ============================ */
var postgisSymbolizer;
 
/* ============================ *
 * 		   	  Styles
 * ============================ */
var postgisStyle;

/* ============================ *
 * 			  Layer
 * ============================ */
var osmLayer;
var postgisLayer;

//Zusy
var geoserverUrl = "http://192.168.10.187:8080";
var wmsLayer; 
var wfsLayer;
var wmsSelectControl;
var wfsModifyControl;
var idFilter;
var wfsSaveStrategy;
var wktFormatter;

var metadataTable = "layermeta";
var modifiedTable = "dirtytable";

var selectControl;

var div_MapPage;
var div_SettingsPage;
var div_WelcomePage;
var div_Popup;

var selectedFeature;

/* ============================ *
 * 			 Language
 * ============================ */
var LanguageType = {
	ENGLISH:	{locale: "en", name: "English", welcome: "Welcome"},
	SPANISH:	{locale: "es", name: "Spanish", welcome: "Bienvenido"},
	PORTUGUESE:	{locale: "pt", name: "Portuguese", welcome: "Bem-vindo"}
};

var isFirstTime = true;
var CurrentLanguage = LanguageType.ENGLISH;
var globalresult;

var Arbiter = {
	variableDatabase: null,
	
	serversDatabase: null,
	
	isOnline: false,
	
    Initialize: function() {
		console.log("What will you have your Arbiter do?"); //http://www.youtube.com/watch?v=nhcHoUj4GlQ
		
        
        SQLite.Initialize(this);
       // SQLite.testSQLite(); 
	//	SQLite.dumpFiles();
		
		Cordova.Initialize(this);
		this.variableDatabase = Cordova.openDatabase("variables", "1.0", "Variable Database", 1000000);
		this.serversDatabase = Cordova.openDatabase("servers", "1.0", "Server Database", 1000000);
		
		//Load saved variables
			//LanguageSelected
			//CurrentLanguage

		//Save divs for later
		div_MapPage 		= $('#idMapPage');
		div_SettingsPage	= $('#idSettingsPage');
		div_WelcomePage		= $('#idWelcomePage');
		div_Popup			= $('#popup');
		
		div_Popup.live('pageshow', this.PopulatePopup);
		//div_Popup.live('pagehide', this.DestroyPopup);
		
		//Start on the Language Select screen if this is the users first time.
		if(isFirstTime) {
			$.mobile.changePage(div_WelcomePage, "pop");
		} else {
			UpdateLocale();
		}
		
		//Initialize Projections
		WGS84 					= new OpenLayers.Projection('EPSG:4326');
		WGS84_Google_Mercator	= new OpenLayers.Projection('EPSG:900913');
						
		//Initialize Layers
		osmLayer		=	new OpenLayers.Layer.OSM('OpenStreetMap', null, {
								transitionEffect: 'resize'
							});
		
		wktFormatter = new OpenLayers.Format.WKT();
		
		wfsSaveStrategy = new OpenLayers.Strategy.Save();
		
		// WMS Layer for viewing the features
		/*wmsLayer = new OpenLayers.Layer.WMS('Test', geoserverUrl + "/geoserver/wms", {
											layers: 'medford:hospitals',
											transparent: 'TRUE'
											});
		
		// WFS Layer for editing features selected by the user
		wfsLayer = new OpenLayers.Layer.Vector(
				   "Medford Hospitals", {
					strategies: [wfsSaveStrategy],
					projection: new OpenLayers.Projection("EPSG:4326"),
				   protocol : new OpenLayers.Protocol.WFS({
							version: "1.0.0",
							  url : geoserverUrl + "/geoserver/wfs",
							  featureNS : "http://medford.opengeo.org",
							geometryName : "the_geom",
							  featureType : "hospitals",
							srsName: "EPSG:4326"
					})
		});
		
		wfsModifyControl = new OpenLayers.Control.ModifyFeature(wfsLayer);*/
		// Control allowing the user to select features for editing 
		
		// create map
		map = new OpenLayers.Map({
			div: "map",
			projection: WGS84_Google_Mercator,
			displayProjection: WGS84,
			theme: null,
			numZoomLevels: 18,
			layers: [
				osmLayer
			],
			controls: [
				new OpenLayers.Control.Attribution(),
				new OpenLayers.Control.TouchNavigation({
					dragPanOptions: {
						enableKinetic: true
					}
				}),
				new OpenLayers.Control.Zoom()
			],
			center: new OpenLayers.LonLat(-13676174.875874922, 5211037.111034083),
			zoom: 15
		});
		
		var arbiter = this;
		
		$("#saveButton").mouseup(function(event){
			map.layers[map.layers.length - 1].strategies[0].save();
		});
		
		$("#attributesButton").mouseup(function(event){
			$.mobile.changePage("#popup", "pop");
		});
		
		$("#addLayerBtn").mouseup(function(event){
			$.mobile.changePage("#addLayerDialog", "pop");	
		});
		
		$("#addLayerSubmit").mouseup(function(event){
			 arbiter.AddLayer({
				  featureNS: $("#featureNS").val(),
				  url: $("#layerurl").val(),
				  geomName: "the_geom",
				  featureType: $("#featureType").val(),
				  srsName: "EPSG:4326",
				  nickname: $("#layernickname").val(),
				  alreadyIn: false
			});							 
		});
		
		$("#pullFeatures").mouseup(function(event){
				var currentBounds = map.calculateBounds().transform(WGS84_Google_Mercator, WGS84);
				
				var featureType = 'medford:hospitals';
				var postData = '<wfs:GetFeature service="WFS" version="1.0.0" outputFormat="GML2" ' +
							'xmlns:usa="http://usa.opengeo.org" xmlns:wfs="http://www.opengis.net/wfs" ' +
							'xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml" ' +
							'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs ' +
							'http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd"> ' +
								'<wfs:Query typeName="' + featureType + '">' +
									   '<ogc:Filter>' +
											'<ogc:BBOX>' +
												'<ogc:PropertyName>the_geom</ogc:PropertyName>' +
													'<gml:Box srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
														'<gml:coordinates>' + currentBounds.left + ',' + currentBounds.bottom +
														' ' + currentBounds.right + ',' + currentBounds.top + '</gml:coordinates>' +
													'</gml:Box>' +
											'</ogc:BBOX>' +
									   '</ogc:Filter>' +
								'</wfs:Query>' +
							'</wfs:GetFeature>';
								   
			   var request = new OpenLayers.Request.POST({
					url: geoserverUrl + '/geoserver/wfs',
					data: postData,
					headers: {
						'Content-Type': 'text/xml;charset=utf-8'
					},
					callback: function(response){
						var gmlReader = new OpenLayers.Format.GML({
							extractAttributes: true
						});
														 
						 var features = gmlReader.read(response.responseText);
						
						 for(var i = 0; i < features.length; i++){
							 features[i].geometry.transform(WGS84, WGS84_Google_Mercator);
							arbiter.insertFeaturesIntoTable(arbiter.serversDatabase, [features[i]], "hospitals");
						 }
														 
						wfsLayer.addFeatures(features);
					},
					failure: function(response){
						console.log('something went wrong');
					}
			   });
		});
		
		this.readLayerFromDb(this.variableDatabase, "hospitals");
		//this.GetFeatures("SELECT * FROM \"Feature\"");
		console.log("Now go spartan, I shall remain here.");
    },
	
	//This function loops through all the languages that are supported and populates
	// the list on #idLanguagePage with the options.
	onClick_LanguageSubmit: function(_div) {
		console.log("onClick(): " + _div.id);
		var language = _div.id;
		
		if(isFirstTime) {
			isFirstTime = false;
		}
		CurrentLanguage = LanguageType[language];
		
		console.log("Language selected: " + CurrentLanguage.name);
		this.UpdateLocale();
		$.mobile.changePage(div_MapPage, "pop");
	},
	
	UpdateLocale: function() {
		$("[data-localize]").localize("locale/Arbiter", { language: CurrentLanguage.locale });
	},
	
	errorSql: function(err){
		console.log('Error processing SQL: ', err);
	},
	
	squote: function(str){
		return "'" + str + "'";
	},
	
	// returns an object with 2 lists like the following:
	// "prop1, prop2, prop3" and "val1, val2, val3"
	getCommaDelimitedLists: function(object){
		var lists = {
			properties: '',
			propertiesWithType: '', 
			values: ''
		};
		
		var addComma = false;
		
		for(var x in object){
			if(addComma){
				lists.propertiesWithType += ', ' + x + ' TEXT';
				lists.properties += ', ' + x;
				lists.values += ', ' + this.squote(object[x]);
				
			}else{
				lists.propertiesWithType += x + ' TEXT';
				lists.properties += x;
				lists.values += this.squote(object[x]);
				addComma = true;
			}
		}
		
		return lists;
	},
	
	//return a feature from a row of the data table
	createFeature: function(obj){
		var feature = wktFormatter.read(obj.geometry);
		
		// TODO: somehow get the srid from the table instead of assuming it'll be epsg:4326
		feature.geometry.transform(WGS84, WGS84_Google_Mercator);
		
		for(var x in obj){
			if(x != "geometry" && x != "id"){
				if(x == "fid")
					feature.fid = obj[x];
				else
					feature.attributes[x] = obj[x];
			}
		}

		return feature;
	},
		
	readLayerFromDb: function(db, _spatialFilter){
		
		if(db){
			var arbiter = this;
			var query = function(tx){
				var sql = "select * from " + metadataTable + ";";
				
				tx.executeSql(sql, [], function(tx, res){
					try{
						for(var i = 0; i < res.rows.length;i++){
							var row = res.rows.item(i);
						
							  arbiter.AddLayer({
								   featureNS: row.featurens,
								   url: row.geoserverurl,
								   geomName: row.geomname,
								   featureType: row.featuretype,
								   srsName: row.srsname,
								   nickname: row.nickname,
								   alreadyIn: true
							  });
							  
							var importsql = "select * from " + row.featuretable + ";";
							
							arbiter.serversDatabase.transaction(function(tx){
								tx.executeSql(importsql, [], function(tx, res){
									var layer = map.getLayersByName(row.nickname + "-wfs")[0];
											  
									try{
										for(var i = 0; i < res.rows.length; i++){
											layer.addFeatures([arbiter.createFeature(res.rows.item(i))]);
										}
									}catch(err){
									  console.log(err);
									}
										arbiter.variableDatabase.transaction(function(tx){
											// TODO: Might want to come back and think about optimization
												//Checking to see if the feature is dirty
												tx.executeSql("SELECT * FROM " + modifiedTable + " WHERE layer='" + "hospitals" + "';", [], function(tx, res){
													try{
														for(var i = 0; i < res.rows.length; i++){
															var feature = layer.getFeatureByFid(res.rows.item(i).fid);
															  feature.modified = true;
															  feature.state = OpenLayers.State.UPDATE;
														}
													}catch(err){
															  
													}
												});
										}, arbiter.errorSql, function(){});
								});
								
							}, arbiter.errorSql, function(){});
						}
					}catch(err){
						console.log(err);
					}
				});
			};
									
			db.transaction(query, this.errorSql, function(){});
		}
	},
	
	insertFeaturesIntoTable: function(db, features, layerName){
		var arbiter = this;
		var query = function(tx){
			var lists = arbiter.getCommaDelimitedLists(features[0].attributes); // Need to check to make sure the attributes are in there even if not set
			
			tx.executeSql("CREATE TABLE IF NOT EXISTS " + layerName + " (id integer primary key, fid unique, geometry TEXT NOT NULL, " +
						  lists.propertiesWithType + ");");
			
			for(var i = 0; i < features.length; i++){
				var attributeLists = arbiter.getCommaDelimitedLists(features[i].attributes);
				
				var clonedfeature = features[i].clone();
				clonedfeature.geometry.transform(WGS84_Google_Mercator, WGS84);
				var fid = features[i].fid;
				var geom = arbiter.squote(wktFormatter.write(clonedfeature));
				var selectsql = "SELECT * FROM " + layerName + " WHERE fid='" + features[i].fid + "';";
				
				// if the row with that fid exists in the table, then it's an update
				tx.executeSql(selectsql, [], function(tx, res){
						var exists = true;
							  
						try{
							  console.log(res.rows.item(0));
						}catch(err){
							  exists = false;
						}
					
						if(exists){
							db.transaction(function(tx){
								var updatesql = "UPDATE " + layerName + " SET geometry=" + geom;
										   
								for(var x in clonedfeature.attributes){
									if(x != "fid")
										updatesql += ", " + x + "='" + clonedfeature.attributes[x] + "'";    
								}
								
								var rowid = res.rows.item(0).id;
								updatesql += " WHERE id=" + rowid + ";";
								
								//if its an update, insert feature into the table keeping track of dirty features
								tx.executeSql(updatesql, [], function(tx, res){
									arbiter.variableDatabase.transaction(function(tx){
										tx.executeSql("CREATE TABLE IF NOT EXISTS " + modifiedTable + " (id integer primary key, fid unique, " +
													  "layer text not null);");
												
										tx.executeSql("INSERT INTO " + modifiedTable + " (fid, layer) VALUES ('" +
															fid + "', '" + layerName + "');");
										
									}, arbiter.errorSql, function(){});
								});
										   
							}, arbiter.errorSql, function(){});
						}else{
							  var insertsql = "INSERT INTO " + layerName + " (fid, geometry, " + lists.properties 
							  + ") VALUES ('" + fid + "', " + geom + ", " + attributeLists.values + ");";
							
							db.transaction(function(tx){
								tx.executeSql(insertsql);					 
							}, arbiter.errorSql, function(){});
						}
				});
			}
				
		};
		
		db.transaction(query, this.errorSql, function(){});
	},
	
	SubmitAttributes: function(){
		if(selectedFeature){
			 
			// Set the attributes of the feature from the form
			for(var x in selectedFeature.attributes){
				selectedFeature.attributes[x] = $("#textinput-" + x).val();
			}
			
			// If the feature isn't already supposed to be added, the state and modified must be set
			if(!selectedFeature.state){
				selectedFeature.state = OpenLayers.State.UPDATE;
				selectedFeature.modified = true;
			}
			
			this.insertFeaturesIntoTable(this.serversDatabase, [selectedFeature], "hospitals");
		}
		
		//$.mobile.changePage("#idMapPage", {transition: "slide", reverse: true});
		$.mobile.changePage("#idMapPage", "pop");
	},
	
	/*CreatePopup: function(_feature) {
		console.log("create feature");
		
		selectedFeature = _feature;
		$.mobile.changePage("#popup", "pop");
	},*/
	
	PopulatePopup: function(event, ui) {
		if(selectedFeature){
			var li = "";
			for(var attr in selectedFeature.attributes){
			
				//if(attr != "Image") {
					//li += "<li><div>" + attr + ":</div><div> - "
					//+ selectedFeature.attributes[attr] + "</div></li>";
					
					li += "<li><div>";
					li += "<label for='textinput" + selectedFeature.attributes[attr] + "'>";
					li += attr;
					li += "</label>";
					li += "<input name='' id='textinput-" + attr + "' placeholder='' value='";
					li += selectedFeature.attributes[attr];
					li += "' type='text'></div></li>";
				//}
			}
			
			/*li += "<li><div>" + "Location" + ":</div><div> - "
			+ selectedFeature.geometry.getBounds().getCenterLonLat() + "</div></li>";*/
			
			$("ul#details-list").empty().append(li).listview("refresh");
		}
	},
	
	//db filename, table in db file, featureType, featureNS, geomName, srsName, geoserverURL, nickname 
	StoreLayerMetadata: function(db, metadata){
		var arbiter = this;
		var query = function(tx){
			tx.executeSql("CREATE TABLE IF NOT EXISTS " + metadataTable + " (id integer primary key, file text not null, featuretable text not null," +
				" featuretype text not null, featurens text not null, geomname text not null, srsname text not null, geoserverurl text not null," +
				" nickname text not null);");
			
			tx.executeSql("INSERT INTO " + metadataTable + " (file, featuretable, featuretype, featurens, geomname, srsname, geoserverurl, nickname) VALUES ('" +
				metadata.file + "', '" + metadata.table + "', '" + metadata.featureType + "', '" + metadata.featureNS + "', '" +
				metadata.geomName + "', '" + metadata.srsName + "', '" + metadata.geoserverURL + "', '" + metadata.nickname + "');");
		};
		
		db.transaction(query, this.errorSql, function(){});
	},
	
	/*
	 	meta: {
	 		featureNS,
	 		url,
	 		geomName,
	 		featureType,
	 		srsName,
	 		nickname,
	 		alreadyIn
	 	}
	 */
	AddLayer: function(meta){
		if(meta.url && meta.featureNS && meta.featureType){ // theres no wfs layer for that layer yet
			var arbiter = this;
			var protocol = new OpenLayers.Protocol.WFS({
				version: "1.0.0",
				url : meta.url + "/wfs",
				featureNS : meta.featureNS,
				geometryName : meta.geomName,
				featureType : meta.featureType,
				srsName: meta.srsName
			});
			
			// TODO: replace later with dynamic implementation
			var tableName = "hospitals";
			
			var saveStrategy = new OpenLayers.Strategy.Save();
			
			var newWFSLayer = new OpenLayers.Layer.Vector(meta.nickname + "-wfs", {
				strategies: [saveStrategy],
				projection: WGS84,
				protocol: protocol
			});
			
			// TODO: Get the layer dynamically
			var newWMSLayer = new OpenLayers.Layer.WMS(meta.nickname + "-wms", meta.url + "/wms", {
				layers: 'medford:hospitals',
				transparent: 'TRUE'
			});
			
			map.addLayers([newWMSLayer, newWFSLayer]);
			
			newWFSLayer.events.register("featuremodified", null, function(event){
				arbiter.insertFeaturesIntoTable(arbiter.serversDatabase, [event.feature], meta.nickname);
			});
			
			saveStrategy.events.register("success", '', function(){
				
				//Update the wmsLayer with the save
				newWMSLayer.mergeNewParams({
					'ver' : Math.random() // override browser caching
				});
				
				newWMSLayer.redraw(true);
										 
				//Remove the features for this layer from the table keeping track of dirty features
				arbiter.variableDatabase.transaction(function(tx){
					tx.executeSql("DELETE FROM " + modifiedTable + " WHERE layer='" + tableName + "';", [], 
								  function(){}, function(tx, err){
								  console.log("error: ", err);
								  });															  
				}, arbiter.errorSql, function(){console.log("delete success");});
			});
			
			var modifyControl = new OpenLayers.Control.ModifyFeature(newWFSLayer);
			
			//TODO: Change the active modify control			
			map.addControl(modifyControl);
			modifyControl.activate();
						
			if(!wmsSelectControl){
				wmsSelectControl = new OpenLayers.Control.WMSGetFeatureInfo({
					url: meta.url + '/wms',
					title: 'identify features on click',
					//	layers: [ wmsLayer ],
					queryVisible: true
				});
				
				wmsSelectControl.infoFormat = 'application/vnd.ogc.gml';
				
				// TODO: adjust the handler so that it can handle multiple features at that location
				wmsSelectControl.events.register("getfeatureinfo", this, function(event){
					
					//if there are any features at the touch event, get that feature in the wfs layer for editing
					if(event && event.features && event.features.length && (!newWFSLayer.getFeatureByFid(event.features[0].fid))){
						var geom = event.features[0].geometry.transform(WGS84, WGS84_Google_Mercator);
						var attributes = event.features[0].attributes;
						var newFeature = new OpenLayers.Feature.Vector(geom, attributes);
						newFeature.fid = event.features[0].fid;
						
					//	var gml = event.features[0].gml;
						
					//	wfsLayer.addFeatures([newFeature]);
						newWFSLayer.addFeatures([newFeature]);
						modifyControl.selectControl.select(newFeature);
						//wfsModifyControl.selectControl.select(newFeature);
						
						selectedFeature = newFeature;
						
						arbiter.insertFeaturesIntoTable(arbiter.serversDatabase, [event.features[0]], meta.nickname);
					}
				});
				
				map.addControl(wmsSelectControl);
				wmsSelectControl.activate();
			}
			
			var li = "<li><a href='#'>" + meta.nickname + "</a></li>";
			
			try{
				$("ul#layer-list").append(li).listview("refresh");
			}catch(err){
				
			}
		}
		
		if(!meta.alreadyIn){
			$.mobile.changePage("#layerPage", "pop");
			this.StoreLayerMetadata(this.variableDatabase, {
				file: "variables",
				table: "hospitals",
				featureType: meta.featureType,
				featureNS: meta.featureNS,
				geomName: meta.geomName,
				srsName: meta.srsName,
				nickname: meta.nickname,
				geoserverURL: meta.url
			});
		}
	},
	
	//Get the current bounds of the map for GET requests.
	getCurrentExtent: function() {
		return map.getExtent();
	},
	
	//===================
	// Cordova Callbacks
	//===================
	onPause: function() {
		console.log("Arbiter: Pause");
	},
	
	onResume: function() {
		console.log("Arbiter: Resume");
	},
	
	onOnline: function() {
		console.log("Arbiter: Online");
		if(!this.isOnline){
			this.isOnline = true;
		}
	},
	
	onOffline: function() {
		console.log("Arbiter: Offline");
		if(this.isOnline){
			this.Online = false;
		}
	},
	
	onBatteryCritical: function(info) {
		console.log("Arbiter: Battery Level Critical " + info.level + "%");
	},
	
	onBatteryLow: function(info) {
		console.log("Arbiter: Battery Level Low " + info.level + "%");
	},
	
	onBatteryStatus: function(info) {
		console.log("Arbiter: Battery Level " + info.level + "% isPlugged: " + info.isPlugged);
	}
};