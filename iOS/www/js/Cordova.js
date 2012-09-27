var application	= null;

var Cordova = {
	
	//=======
	// Cordova
	//=======
	Initialize: function(_app) {
		if(_app) {
			application = _app;
		}
		//Bind Posse callbacks to most of Cordova's events.
        this.bindCordovaCallbacks();
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