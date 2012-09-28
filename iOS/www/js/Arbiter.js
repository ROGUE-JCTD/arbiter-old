
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
var wfsFilter;
var wfsFilterStrategy;
var wmsSelectControl;
var wfsModifyControl;
var cqlFormatter;
var xmlFormatter;
var filterFormatter;
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
		cqlFormatter = new OpenLayers.Format.CQL();
		xmlFormatter = new OpenLayers.Format.XML();
		filterFormatter = new OpenLayers.Format.Filter({
			version: "1.0.0"
		});
		
		wfsSaveStrategy = new OpenLayers.Strategy.Save();
		
		// WMS Layer for viewing the features
		wmsLayer = new OpenLayers.Layer.WMS('Test', geoserverUrl + "/geoserver/wms", {
											layers: 'medford:hospitals',
											transparent: 'TRUE'
											});
		
		// Filter for only getting features that the user wants to edit
		wfsFilter = new OpenLayers.Filter.FeatureId({
			fids: []
													});
		
		wfsFilterStrategy = new OpenLayers.Strategy.Filter({
			filter : wfsFilter
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
			/*vendorParams : {
				"CQL_FILTER" : cqlFormatter.write(idFilter)
			},*/
			queryVisible: true
		});
		
		wmsSelectControl.infoFormat = 'application/vnd.ogc.gml';
		
		// TODO: adjust the handler so that it can handle multiple features at that location
		wmsSelectControl.events.register("getfeatureinfo", this, function(event){
				
				//if there are any features at the touch event, get that feature in the wfs layer for editing
				if(event && event.features && event.features.length && (wfsFilter.fids.indexOf(event.features[0].fid) == -1)){
										 
						$("#editButton").show();
							
						var geom = event.features[0].geometry.clone().transform(WGS84, WGS84_Google_Mercator);
						var attributes = event.features[0].attributes;
						var newFeature = new OpenLayers.Feature.Vector(geom, attributes);
						newFeature.fid = event.features[0].fid;
						wfsLayer.addFeatures([newFeature]);
						
						wfsModifyControl.selectControl.select(newFeature);
						this.StoreFeature(newFeature);
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
		
		wfsLayer.events.register("featuremodified", null, function(event){
				
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
		console.log('Error processing SQL: ' + err);
	},
	
	squote: function(str){
		return "'" + str + "'";
	},
	
	// returns an object with 2 lists like the following:
	// "prop1, prop2, prop3" and "val1, val2, val3"
	getCommaDelimitedListsWithType: function(object){
		var lists = {
			properties: '',
			values: ''
		};
		
		var addComma = false;
		
		for(var x in object){
			if(addComma){
				lists.properties += ', ' + x + ' TEXT';
				lists.values += ', ' + this.squote(object[x]);
				
			}else{
				lists.properties += x + ' TEXT';
				lists.values += this.squote(object[x]);
				addComma = true;
			}
		}
		
		return lists;
	},

	getCommaDelimitedLists: function(object){
		var lists = {
		properties: '',
		values: ''
		};
		
		var addComma = false;
		
		for(var x in object){
			if(addComma){
				lists.properties += ', ' + x;
				lists.values += ', ' + this.squote(object[x]);
				
			}else{
				lists.properties += x;
				lists.values += this.squote(object[x]);
				addComma = true;
			}
		}
		
		return lists;
	},
	
	// create the features and properties tables for the server
	createServerTables: function(db, _layerName, _attributes){
		
		//create a list of attributes
		var lists = this.getCommaDelimitedListsWithType(_attributes);
		console.log(lists);
		var create = function(tx){
			
			var featureSql = 'CREATE TABLE IF NOT EXISTS ' + _layerName + ' (id integer primary key, geometry TEXT NOT NULL, ' +
			lists.properties + ');';
			
			/*var featureSql = 'CREATE TABLE IF NOT EXISTS ' + _layerName + ' (fid unique, geometry TEXT NOT NULL, ' +
			attributeList + 'modified INTEGER DEFAULT 0, pid INTEGER);';
			
			/*var propertiesSql = 'CREATE TABLE IF NOT EXISTS ' + _serverName + '_properties (id INTEGER PRIMARY KEY, geomName TEXT NOT NULL, ' +
			'featureNS TEXT NOT NULL, srsName TEXT NOT NULL, featureType TEXT NOT NULL);';*/
			
			tx.executeSql(featureSql);
			//tx.executeSql(propertiesSql);
		};
		
		
		db.transaction(create, this.errorSql);
	},
	
	readLayerFromDb: function(_layerName){
		
	},
	
	insertFeatureIntoTable: function(db, _feature, _layerName){
		var lists = this.getCommaDelimitedLists(_feature.attributes);
		
		var clonedfeature = _feature.clone();
		clonedfeature.geometry.transform(WGS84_Google_Mercator, WGS84);
		var geom = this.squote(wktFormatter.write(clonedfeature));
		//var protocol = _feature.layer.protocol;
		
		//check to see if the layer is already in the db
		// check against namespace and featureType
		
		var query = function (tx) {
			console.log("insert");
			var insertsql = "INSERT INTO " + _layerName + " (geometry, " + lists.properties + ") VALUES (" + geom + ", " + lists.values + ");";
			console.log(insertsql);
			tx.executeSql(insertsql, [], function(_tx, _res){
						  console.log("insertid: " + _res.insertId);
						 // console.log(_tx);
						  //console.log(res);
						 // console.log(res.rows.item(0));
						  var selectsql = "select * from hospitals;";
						  _tx.executeSql(selectsql, [], function(t, res){
										 for(var i = 0; i < res.rows.length; i++)
										 {
										 console.log(res.rows.item(i));
										 }
						});
			});
			/*tx.executeSql("SELECT * FROM " + _serverName + "_properties WHERE featureNS='" + protocol.featureNS + "' AND featureType='" + protocol.featureType + "';", [], function(tx, results) {
				if(!results.rows.length){
					  tx.executeSql("INSERT INTO " + _serverName + "_properties (geomName, featureNS, srsName, featureType) VALUES ('" +
						protocol.geometryName + "', '" + protocol.featureNS + "', '" + protocol.srsName + "', '" + protocol.featureNS + "');"); 
				}
			});*/
		};
				  
		db.transaction(query, this.errorSql);
	},
	
	//Store the feature in the local features db
	StoreFeature: function(_feature) {
		//check to see if a table already exists for the layer, if not create one
		this.createServerTables(this.serversDatabase, "hospitals", _feature.attributes);
		
		this.insertFeatureIntoTable(this.serversDatabase, _feature, "hospitals");
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