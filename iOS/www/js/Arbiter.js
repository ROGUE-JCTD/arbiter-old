
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

var variableDatabase;

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

var Arbiter = {
    Initialize: function() {
		console.log("What will you have your Arbiter do?"); //http://www.youtube.com/watch?v=nhcHoUj4GlQ
		
		Cordova.Initialize(this);
		
		variableDatabase = Cordova.openDatabase("variables", "1.0", "Variable Database", 1000000);
		featuresDatabase = Cordova.openDatabase("features", "1.0", "Features Database", 1000000);
		
		featuresDatabase.transaction(function(tx){ //do
									 //set up the table with the features fid, geometry, whatever attributes the layer has
									 tx.executeSql('CREATE TABLE IF NOT EXISTS layer1 (fid unique, geometry, name, url, featureNS, geometryName, featureType, srsName)');
		 }, function(tx, err){ //error
									 alert("error processing sql: " + err);
		 },
		 function(){ //success
									 
		 });
		
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
							
		/*postgisStyle =	new OpenLayers.StyleMap({
							externalGraphic: "${Image}",
							graphicOpacity: 1.0,
							graphicWidth: 16,
							graphicHeight: 26,
							graphicYOffset: -26
						});*/
						
		//Initialize Layers
		osmLayer		=	new OpenLayers.Layer.OSM('OpenStreetMap', null, {
								transitionEffect: 'resize'
							});
		/*postgisLayer	= 	new OpenLayers.Layer.Vector('PostGIS Layer', {
								transitionEffect: 'resize',
								rendererOptions: { zIndexing: true },
								styleMap: 			postgisStyle,
								displayProjection:	WGS84,
								projection: 		WGS84_Google_Mercator
							});
							
		selectControl = new OpenLayers.Control.SelectFeature(postgisLayer, {
			autoActivate:true,
			onSelect: this.CreatePopup
		});*/
		
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
					strategies: [new OpenLayers.Strategy.Fixed(), wfsFilterStrategy, wfsSaveStrategy],
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
						//if(wfsFilter.fids.length)
					//		wfsFilter.fids[0] = event.features[0].fid;
				//		else
						wfsFilter.fids.push(event.features[0].fid);
										 
						wfsFilterStrategy.setFilter(wfsFilter);
										 
						$("#editButton").show();
										 
						wfsModifyControl.selectControl.select(wfsLayer.features[0]);
										 
										 featuresDatabase.transaction(function(tx){ //do
										  //set up the table with the features fid, geometry, whatever attributes the layer has
												  var protocol = wfsLayer.features[0].layer.protocol;
												  
												  var sql = 'INSERT INTO layer1 (fid, geometry, name, url, featureNS, geometryName, featureType, srsName) VALUES ("' + wfsLayer.features[0].fid + '", "' + wktFormatter.write(wfsLayer.features[0]) + '", "'
												  + wfsLayer.features[0].attributes.name + '", "' + protocol.url + '", "' + protocol.featureNS + '", "' +
												  protocol.geometryName + '", "' + protocol.featureType + '", "' + protocol.srsName + '")';
												  
												  console.log("sql: " + sql);
												tx.executeSql(sql);
										  }, function(tx, err){ //error
										  alert("error processing sql: " + err);
										  },
										  function(){ //success
										  
										  });
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
				osmLayer//,
				//postgisLayer,
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
			center: new OpenLayers.LonLat(0, 0),
			zoom: 1
		});
		
		// Add the layers to the map
		map.addLayers([wmsLayer, wfsLayer]);
		
		// Activate the "select" feature control to ready for use
		wmsSelectControl.activate();
		wfsModifyControl.activate();
		
		wfsLayer.events.register("featuremodified", null, function(event){
				//if the feature hasn't been added to the wms filter, add it
			//	if(!wfsFilter.fids.contains(event.feature.fid)){
					
			//	}
		});
		
		wfsSaveStrategy.events.register("success", '', function(){
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
	
	/*GetFeatures: function(_sql) {
		$.ajax({
			type:		'GET',
			url:		"http://localhost:8080/DRServer/rest/postgis",
			data:		{
				sql:	_sql
			},
			success:	function(data, status, xhr) {
				//success.call(null, data, status, xhr);
			 	console.log("Get Success");
				this.ParseData(data);
			},
			error:	function(xhr, status, err) {
			   //error.call(null, xhr, status, err);
			   console.log("Get Failed");
			   console.log(xhr);
			   console.log(status);
			   console.log(err);
			}
		});
	},
	
	PostFeatures: function(_sql) {
		$.ajax({
		   	type:		'POST',
		   	url:		"http://localhost:8080/DRServer/rest/postgis",
		   	data:		{
		   		sql:	_sql
		   	},
		   	success:	function(data, status, xhr) {
		   		//success.call(null, data, status, xhr);
		   		console.log("Post Success");
		   	},
		   	error:	function(xhr, status, err) {
		   		//error.call(null, xhr, status, err);
		   		console.log("Post Failed");
		   		console.log(xhr);
				console.log(status);
		   		console.log(err);
		   	}
		});
	},
	
	ParseData: function(_data) {
		console.log("ParseData: " + _data);
		
		var features = $.trim(_data).split("Feature: {");
		
		//Loop through each feature
		for(var i = 1; i < features.length; i++) {
		
			var attributes = $.trim(features[i]).split(",");
			
			var point = new OpenLayers.Geometry.Point(
					attributes[1].substr(3,attributes[1].length),
					attributes[2].substr(3,attributes[2].length));
					
			var locationFeature = new OpenLayers.Feature.Vector(point, {
					Image: "img/mobile-loc.png",
					Name: attributes[0].substr(6,attributes[0].length),
					id: attributes[3].substr(5,attributes[3].length)
			});
			
			postgisLayer.addFeatures([locationFeature]);
		}
	},*/
	
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