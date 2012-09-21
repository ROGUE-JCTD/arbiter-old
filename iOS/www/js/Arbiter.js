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

var selectControl;

var div_Popup;

var selectedFeature;

var Arbiter = {
    Initialize: function() {
		console.log("What will you have your Arbiter do?"); //http://www.youtube.com/watch?v=nhcHoUj4GlQ
		
		Cordova.Initialize(this);
        
        SQLite.Initialize(this);
        SQLite.testSQLite(); 
		SQLite.dumpFiles();
		
		//Save divs for later
		div_Popup	= $('#popup');
		div_Popup.live('pageshow', this.PopulatePopup);
		div_Popup.live('pagehide', this.DestroyPopup);
		
		//Initialize Projections
		WGS84 					= new OpenLayers.Projection('EPSG:4326');
		WGS84_Google_Mercator	= new OpenLayers.Projection('EPSG:900913');
							
		postgisStyle =	new OpenLayers.StyleMap({
							externalGraphic: "${Image}",
							graphicOpacity: 1.0,
							graphicWidth: 16,
							graphicHeight: 26,
							graphicYOffset: -26
						});
						
		//Initialize Layers
		osmLayer		=	new OpenLayers.Layer.OSM('OpenStreetMap', null, {
								transitionEffect: 'resize'
							});
		postgisLayer	= 	new OpenLayers.Layer.Vector('PostGIS Layer', {
								transitionEffect: 'resize',
								rendererOptions: { zIndexing: true },
								styleMap: 			postgisStyle,
								displayProjection:	WGS84,
								projection: 		WGS84_Google_Mercator
							});
							
		selectControl = new OpenLayers.Control.SelectFeature(postgisLayer, {
			autoActivate:true,
			onSelect: this.CreatePopup
		});
		
		// create map
		map = new OpenLayers.Map({
			div: "map",
			theme: null,
			projection: WGS84_Google_Mercator,
			displayProjection:	WGS84,
			numZoomLevels: 18,
			layers: [
				osmLayer,
				postgisLayer
			],
			controls: [
				new OpenLayers.Control.Attribution(),
				new OpenLayers.Control.TouchNavigation({
					dragPanOptions: {
						enableKinetic: true
					}
				}),
				new OpenLayers.Control.Zoom(),
				selectControl
			],
			center: new OpenLayers.LonLat(0, 0),
			zoom: 1
		});
				
		this.GetFeatures("SELECT * FROM \"Feature\"");
		console.log("Now go spartan, I shall remain here.");
    },
	
	GetFeatures: function(_sql) {
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