var application	= null;

var Cordova = {

	CurrentUser: {
		Acceleration : {
			x: 0,
			y: 0,
			z: 0,
			timestamp: 0,
			
			Log: function() {
				console.log("CurrentUser.Acceleration");
				console.log(" - .x: " + this.x);
				console.log(" - .y: " + this.y);
				console.log(" - .z: " + this.z);
				console.log(" - .timestamp: " + this.timestamp);
			}
		},
		
		Compass : {
			magneticHeading:	0,
			trueHeading:		0,
			headingAccuracy:	0,
			timestamp:			0,
			
			Log: function() {
				console.log("CurrentUser.Compass");
				console.log(" - .magneticHeading: " + this.magneticHeading);
				console.log(" - .trueHeading: " + this.trueHeading);
				console.log(" - .headingAccuracy: " + this.headingAccuracy);
				console.log(" - .timestamp: " + this.timestamp);
			}
		},
		
		Connection : {
			type: 0,
			
			Log: function() {
				console.log("CurrentUser.Connection");
				console.log(" - .type: " + this.type);
			}
		},
		
		Device : {
			name:			"No Name",
			cordovaVersion:	"No Cordova",
			platform:		"No Platform",
			uuid:			"No UUID",
			version:		"No Version",
			
			Log: function() {
				console.log("CurrentUser.Device");
				console.log(" - .name: " + this.name);
				console.log(" - .cordovaVersion: " + this.cordovaVersion);
				console.log(" - .platform: " + this.platform);
				console.log(" - .uuid: " + this.uuid);
				console.log(" - .version: " + this.version);
			}
		},
		
		GeoLocation : {
			latitude:			0,
			longitude:			0,
			altitude:			0,
			accuracy:			0,
			altitudeAccuracy:	0,
			heading:			0,
			speed:				0,
			timestamp:			0,	/* Seconds on iOS */
			
			Log: function() {
				console.log("CurrentUser.GeoLocation");
				console.log(" - .latitude: " + this.latitude);
				console.log(" - .longitude: " + this.longitude);
				console.log(" - .altitude: " + this.altitude);
				console.log(" - .accuracy: " + this.accuracy);
				console.log(" - .altitudeAccuracy: " + this.altitudeAccuracy);
				console.log(" - .heading: " + this.heading);
				console.log(" - .speed: " + this.speed);
				console.log(" - .timestamp: " + this.timestamp);
			}
		},
		
		Log : function() {
			this.Acceleration.Log();
			this.Compass.Log();
			this.Connection.Log();
			this.Device.Log();
			this.GeoLocation.Log();
		}
	},
	
	CordovaOptions_Accelerometer: {
		frequency: 5000 /* How often to retrieve the Acceleration in milliseconds. Default: 10000 */
	},
	
	CordovaOptions_Compass: {
		frequency: 500,	/* How often to retrieve the compass heading in milliseconds. Default: 100 */
		filter: 1		/* The change in degrees required to initiate a watchHeading success callback. */
	},
	
	CordovaOptions_GeoLocation: {
		enableHighAccuracy: true,	/* Provides a hint that the application would like to
								 receive the best possible results. Must be true for Android */
		timeout: 5000,		/* The maximum length of time (msec) that is allowed to pass. */
		maximumAge: 4000	/* Accept a cached position whose age is no greater than the specified time in milliseconds. */
	},
	
	WatchID_Accelerometer: null,
	WatchID_Compass: null,
	WatchID_GeoLocation: null,
	
	//=======
	// Cordova
	//=======
	Initialize: function(_app) {
		if(_app) {
			application = _app;
		}
		
		//Bind Posse callbacks to most of Cordova's events.
        this.bindCordovaCallbacks();
		
		//Start Watches
		//this.startWatch_GeoLocation();
    },
	
	//===================
	// Helpful Functions
	//===================
	alert: function(_message, _callback, _title, _buttonName) {
		 navigator.notification.alert(_message, _callback, _title, _buttonName);
	},
	
	//iOS Quirk: _milliseconds is ignored.
	vibrate: function(_milliseconds) {
		navigator.notification.vibrate(_milliseconds);
	},
	
	//=========
	// Storage
	//=========
	openDatabase: function(_name, _version, _displayName, _size) {
		return window.sqlitePlugin.openDatabase(_name, _version, _displayName, _size);
	},
	
	//=============
	// GeoLocation
	//=============
	startWatch_GeoLocation: function() {
		WatchID_GeoLocation = navigator.geolocation.watchPosition(this.geolocationSuccess,
			this.geolocationError, this.CordovaOptions_GeoLocation);
	},
	
	stopWatch_GeoLocation: function() {
		if(WatchID_GeoLocation) {
			navigator.accelerometer.clearWatch(WatchID_GeoLocation);
			WatchID_GeoLocation = null;
		}
	},
	
	geolocationSuccess: function(_position) {
		Cordova.CurrentUser.GeoLocation.latitude			= _position.coords.latitude;
		Cordova.CurrentUser.GeoLocation.longitude			= _position.coords.longitude;
		Cordova.CurrentUser.GeoLocation.altitude			= _position.coords.altitude;
		Cordova.CurrentUser.GeoLocation.accuracy			= _position.coords.accuracy;
		Cordova.CurrentUser.GeoLocation.altitudeAccuracy	= _position.coords.altitudeAccuracy;
		Cordova.CurrentUser.GeoLocation.heading				= _position.coords.heading;
		Cordova.CurrentUser.GeoLocation.speed				= _position.coords.speed;
		Cordova.CurrentUser.GeoLocation.timestamp			= new Date(_position.timestamp);
	},
	
	//====================
	// Callback Functions
	//====================
	bindCordovaCallbacks: function() {
		document.addEventListener("pause",				this.onPause,			false);
		document.addEventListener("resume",				this.onResume,			false);
		document.addEventListener("online",				this.onOnline,			false);
		document.addEventListener("offline",			this.onOffline,			false);
		  window.addEventListener("batterycritical",	this.onBatteryCritical,	false);
		  window.addEventListener("batterylow",			this.onBatteryLow,		false);
		  window.addEventListener("batterystatus",		this.onBatteryStatus,	false);
	},
	
	onPause: function() {
		if(application) {
			application.onPause();
		}
	},
	
	onResume: function() {
		if(application) {
			application.onResume();
		}
	},
	
	onOnline: function() {
		if(application) {
			application.onOnline();
		}
	},
	
	onOffline: function() {
		if(application) {
			application.onOffline();
		}
	},
	
	onBatteryCritical: function(info) {
		if(application) {
			application.onBatteryCritical();
		}
	},
	
	onBatteryLow: function(info) {
		if(application) {
			application.onBatteryLow();
		}
	},
	
	onBatteryStatus: function(info) {
		if(application) {
			application.onBatteryStatus();
		}
	}
};