
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
	
    Initialize: function() {
		console.log("What will you have your Arbiter do?"); //http://www.youtube.com/watch?v=nhcHoUj4GlQ
		
        
        SQLite.Initialize(this);
       // SQLite.testSQLite(); 
	//	SQLite.dumpFiles();
		
		Cordova.Initialize(this);
		this.variableDatabase = window.openDatabase("variables", "1.0", "Variable Database", 1000000);
		this.serversDatabase = window.openDatabase("servers", "1.0", "Server Database", 1000000);
		
		//Load saved variables
			//LanguageSelected
			//CurrentLanguage

		//Save divs for later
		div_MapPage 		= $('#idMapPage');
		div_SettingsPage	= $('#idSettingsPage');
		div_WelcomePage		= $('#idWelcomePage');
		div_Popup			= $('#popup');
		
		div_Popup.live('pageshow', this.PopulatePopup);
		div_Popup.live('pagehide', this.DestroyPopup);
		
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
		wmsLayer = new OpenLayers.Layer.WMS('Test', geoserverUrl + "/geoserver/wms", {
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
		
		wfsModifyControl = new OpenLayers.Control.ModifyFeature(wfsLayer);
		// Control allowing the user to select features for editing 
		wmsSelectControl = new OpenLayers.Control.WMSGetFeatureInfo({
			url: geoserverUrl + '/geoserver/wms',
			title: 'identify features on click',
			layers: [ wmsLayer ],
			queryVisible: true
		});
		
		wmsSelectControl.infoFormat = 'application/vnd.ogc.gml';
		
		// TODO: adjust the handler so that it can handle multiple features at that location
		wmsSelectControl.events.register("getfeatureinfo", this, function(event){
				
				//if there are any features at the touch event, get that feature in the wfs layer for editing
				if(event && event.features && event.features.length && (!wfsLayer.getFeatureByFid(event.features[0].fid))){
										 
						$("#editButton").show();
							
						var geom = event.features[0].geometry.clone().transform(WGS84, WGS84_Google_Mercator);
						var attributes = event.features[0].attributes;
						var newFeature = new OpenLayers.Feature.Vector(geom, attributes);
						newFeature.fid = event.features[0].fid;
						wfsLayer.addFeatures([newFeature]);
						
						wfsModifyControl.selectControl.select(newFeature);
						this.insertFeaturesIntoTable(this.serversDatabase, [event.feature], "hospitals");
				}
		});
		
		
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
				new OpenLayers.Control.Zoom(),
				wmsSelectControl,
				wfsModifyControl
			],
			center: new OpenLayers.LonLat(-13676174.875874922, 5211037.111034083),
			zoom: 15
		});
		
		// Add the layers to the map
		map.addLayers([wmsLayer, wfsLayer]);
		
		// Activate the "select" feature control to ready for use
		wmsSelectControl.activate();
		wfsModifyControl.activate();
		
		var arbiter = this;
		wfsLayer.events.register("featuremodified", null, function(event){
				arbiter.insertFeaturesIntoTable(arbiter.serversDatabase, [event.feature], "hospitals");
		});
		
		wfsSaveStrategy.events.register("success", '', function(){
			
			//Update the wmsLayer with the save
			wmsLayer.mergeNewParams({
				'ver' : Math.random() // override browser caching
			});
			
			wmsLayer.redraw(true);
		});
		
		$("#editButton").mouseup(function(event){
			wfsSaveStrategy.save();
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
							arbiter.insertFeaturesIntoTable(arbiter.serversDatabase, [features[i]], "hospitals");
						 	features[i].geometry.transform(WGS84, WGS84_Google_Mercator);
						 }
														 
						wfsLayer.addFeatures(features);
					},
					failure: function(response){
						console.log('something went wrong');
					}
			   });
		});
		
		this.readLayerFromDb(this.serversDatabase, "hospitals");
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
		console.log('Error processing SQL: ' + console.log(err));
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
	
	//return a feature
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
		
	readLayerFromDb: function(_db, _layerName, _spatialFilter){
		if(_layerName){
			var arbiter = this;
			var query = function(tx){
				var sql = "select * from " + _layerName + ";";
				
				var success = function(tx, res){
					var layer = new OpenLayers.Layer.Vector(_layerName, {
						projection:	WGS84  										
					});
					
					var features = [];
					for(var i = 0; i < res.rows.length; i++){
						features.push(arbiter.createFeature(res.rows.item(i)));
					}
					
					layer.addFeatures(features);
					layer.events.register("featuremodified", null, function(event){
						arbiter.insertFeaturesIntoTable(arbiter.serversDatabase, [event.feature], "hospitals");
					});
					
					map.addLayer(layer);
					var modcontrol = new OpenLayers.Control.ModifyFeature(layer);
					map.addControl(modcontrol);
					modcontrol.activate();
				};
									
				tx.executeSql(sql, [], success);
			};
									
			_db.transaction(query, this.errorSql, function(){});
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
				
				tx.executeSql(selectsql, [], function(tx, res){
						
						var exists = true;
							  
						try{
							  res.rows.item(0);
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
								
								updatesql += " WHERE id=" + res.rows.item(0).id + ";";
										 
								tx.executeSql(updatesql);  				 
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
	
	CreatePopup: function(_feature) {
		console.log("create feature");
		
		selectedFeature = _feature;
		$.mobile.changePage("#popup", "pop");
	},
	
	PopulatePopup: function(event, ui) {
		var li = "";
		for(var attr in selectedFeature.attributes){
		
			if(attr != "Image") {
				//li += "<li><div>" + attr + ":</div><div> - "
				//+ selectedFeature.attributes[attr] + "</div></li>";
				
				li += "<li><div>";
				li += "<label for='textinput" + selectedFeature.attributes[attr] + "'>";
				li += attr;
				li += "</label>";
				li += "<input name='' id='textinput" + selectedFeature.attributes[attr] + "' placeholder='' value='";
				li += selectedFeature.attributes[attr];
				li += "' type='text'></div></li>";
			}
		}
		
		li += "<li><div>" + "Location" + ":</div><div> - "
		+ selectedFeature.geometry.getBounds().getCenterLonLat() + "</div></li>";
		
		$("ul#details-list").empty().append(li).listview("refresh");
	},
	
	DestroyPopup: function(_feature) {
		console.log("destroy feature");
		selectControl.unselect(selectedFeature);
		selectedFeature = null;
	},
	
	updateSelectedFeature: function() {
		selectedFeature.attributes["Name"] = $("#textinput" + selectedFeature.attributes["Name"]).val();
	},
	
	onClick_Submit: function() {
		console.log("submit\n");
		//"UPDATE \"Feature\" SET \"Name\"='TestThree' WHERE \"id\"=3'"
		this.updateSelectedFeature();
		
		var sql = "UPDATE \"Feature\" SET ";
		sql += "\"Name\"='" + selectedFeature.attributes["Name"] + "' ";
		sql += "WHERE \"id\"='" + selectedFeature.attributes["id"] + "';";
		
		console.log(sql + "\n");
		this.PostFeatures(sql);
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
	},
	
	onOffline: function() {
		console.log("Arbiter: Offline");
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