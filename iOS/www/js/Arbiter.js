
/* ============================ *
 *   	    Projections
 * ============================ */
var WGS84;
var WGS84_Google_Mercator;

/* ============================ *
 * 			   Map
 * ============================ */
var map;

var aoiMap;

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

var wmsSelectControl;
var wktFormatter;
var capabilitiesFormatter;
var describeFeatureTypeReader;

var addFeatureControl;

var metadataTable = "layermeta";
var modifiedTable = "dirtytable";

var selectControl;
var selectedFeature;

/*
 *	jQuery Elements
 */
var div_MapPage;

var div_WelcomePage;
var div_ProjectsPage;
var div_NewProjectPage;
var div_ServersPage;
var div_LayersPage;
var div_AreaOfInterestPage;
var div_ArbiterSettingsPage;
var div_ProjectSettingsPage;
var div_Popup;

var jqSaveButton;
var jqAttributesButton;
var jqAddLayerButton;
var jqLayerURL;
//var jqAddLayerSubmit;
var jqCreateFeature;
var jqNewProjectName;
var jqToServersButton;
var jqNewUsername;
var jqNewPassword;
var jqNewNickname;
var jqNewServerURL;
var jqAddServerButton;
var jqGoToAddServer;
var jqAddServerPage;
var jqServerSelect;
var jqLayerSelect;
var jqLayerNickname;
var jqLayerSubmit;
var jqProjectsList;
var jqEditorTab;

var jqAddFeature;
var jqEditFeature;

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

var editorOpen = false;

var Arbiter = {
	
	fileSystem: null,
	
	variableDatabase: null,
	
	serversDatabase: null,
	
	currentProject: {
		name: "default",
		aoi: null,
		variablesDatabase: null,
		dataDatabase: null,
		serverList: {}
	},
	
	isOnline: false,
	
    Initialize: function() {
		console.log("What will you have your Arbiter do?"); //http://www.youtube.com/watch?v=nhcHoUj4GlQ
		
        
        //SQLite.Initialize(this);
		// SQLite.testSQLite(); 
		//SQLite.dumpFiles();
		
		Cordova.Initialize(this);
		
		var arbiter = this;
		
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(filesystem){
			arbiter.fileSystem = filesystem;
						
			filesystem.root.getDirectory("Projects", {create: true, exclusive: false}, function(dir){
					arbiter.InitializeProjectList(dir);
			}, function(error){
					console.log("error getting projects");
			});
		}, function(error){
			console.log("requestFileSystem failed with error code: " + error.code);					 
		});
		
		//Load saved variables
			//LanguageSelected
			//CurrentLanguage

		//Save divs for later
		div_MapPage 		= $('#idMapPage');
		div_WelcomePage		= $('#idWelcomePage');
		div_ProjectsPage	= $('#idProjectsPage');
		div_NewProjectPage	= $('#idNewProjectPage');
		div_ServersPage		= $('#idServersPage');
		div_LayersPage		= $('#idLayersPage');
		div_AreaOfInterestPage = $('#idAreaOfInterestPage');
		div_ArbiterSettingsPage	= $('#idArbiterSettingsPage');
		div_ProjectSettingsPage	= $('#idProjectSettingsPage');
		div_Popup			= $('#popup');
		
		jqSaveButton = $('#saveButton');
		jqAttributesButton = $('#attributesButton');
		jqAddLayerButton = $('#addLayerBtn');
		jqLayerURL = $('#layerurl');
		//jqAddLayerSubmit = $('#addLayerSubmit');
		jqCreateFeature = $('#createFeature');
		jqEditorTab = $('#editorTab');
		jqNewProjectName = $('#newProjectName');
		jqToServersButton = $('#toServersButton');
		jqNewUsername = $('#newUsername');
		jqNewPassword = $('#newPassword');
		jqNewNickname = $('#newNickname');
		jqNewServerURL = $('#newServerURL');
		jqAddServerButton = $('#addServerButton');
		jqGoToAddServer = $('#goToAddServer');
		jqAddServerPage = $('#idAddServerPage');
		jqServerSelect = $('#serverselect');
		jqLayerSelect = $('#layerselect');
		jqLayerNickname = $('#layernickname');
		jqLayerSubmit = $('#addLayerSubmit');
		jqProjectsList = $('ul#idProjectsList');
		
		jqAddFeature	 = $('#addPointFeature');
		jqEditFeature	 = $('#editPointFeature');
		
		div_Popup.live('pageshow', this.PopulatePopup);
		//div_Popup.live('pagehide', this.DestroyPopup);
		
		div_ProjectsPage.live('pageshow', this.PopulateProjectsList);
		div_ServersPage.live('pageshow', this.PopulateServersList);
		div_LayersPage.live('pageshow', this.PopulateLayersList);
		
		//Start on the Language Select screen if this is the users first time.
		//Otherwise move to the Projects page.
		if(!isFirstTime) {
			UpdateLocale();
			this.changePage_Pop(div_ProjectsPage);
		}
		
		//Initialize Projections
		WGS84 					= new OpenLayers.Projection('EPSG:4326');
		WGS84_Google_Mercator	= new OpenLayers.Projection('EPSG:900913');
						
		//Initialize Layers
		osmLayer		=	new OpenLayers.Layer.OSM('OpenStreetMap', null, {
								transitionEffect: 'resize'
							});
		
		aoi_osmLayer = new OpenLayers.Layer.OSM('OpenStreetMap', null, {
			transitionEffect: 'resize'
		});
		
		wktFormatter = new OpenLayers.Format.WKT();
		capabilitiesFormatter = new OpenLayers.Format.WMSCapabilities();
		describeFeatureTypeReader = new OpenLayers.Format.WFSDescribeFeatureType();
		
		div_MapPage.live('pageshow', function(){
			if(!map){
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
			}
		});
		
		div_AreaOfInterestPage.live('pageshow', function(){
			if(!aoiMap){		
				aoiMap = new OpenLayers.Map({
					div: "aoiMap",
					projection: new OpenLayers.Projection("EPSG:900913"),
					displayProjection: new OpenLayers.Projection("EPSG:4326"),
					theme: null,
					numZoomLevels: 18,
					layers: [aoi_osmLayer],
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
					zoom: 12
				});
			}
		});
		
	//	var arbiter = this; // this is initialized earlier in this method
		
		jqSaveButton.mouseup(function(event){
			map.layers[map.layers.length - 1].strategies[0].save();
		});
		
		jqAttributesButton.mouseup(function(event){
			this.changePage($("#popup"));
		});
		
		jqToServersButton.mouseup(function(event){
			var newName = jqNewProjectName.val();
			
			//Fail if the project already exists
			var projectAlreadyExists = function(dir){
				console.log("directory exists: " + dir.name);
				jqNewProjectName.attr('placeholder', 'Project: "' + dir.name + '" already exists! *');
				jqNewProjectName.val('');
				jqNewProjectName.addClass('invalid-field');
				jqToServersButton.removeClass('ui-btn-active');
			};
								  
			//Continue when this is a new project name
			var projectDoesntExist = function(error){
				//Keep going when the file wasn't found
				if(error.code == FileError.NOT_FOUND_ERR){
					arbiter.currentProject.name = newName;
					arbiter.changePage_Pop(div_ServersPage);
					jqNewProjectName.removeClass('invalid-field');
					jqNewProjectName.attr('placeholder', 'Name your Project *');
					jqToServersButton.removeClass('ui-btn-active');
				}else{
					console.log("file system error: " + error.code);				  
				}
		  	};
			
			if(newName)
				arbiter.fileSystem.root.getDirectory("Projects/" + jqNewProjectName.val(), null, projectAlreadyExists, projectDoesntExist);
			else{
				jqNewProjectName.addClass('invalid-field');
				jqToServersButton.removeClass('ui-btn-active');
			}
		});
		
		jqAddLayerButton.mouseup(function(event){
			arbiter.populateAddLayerDialog(null);
		});
		
		jqServerSelect.change(function(event){
			//var serverUrl = $(this).val();
			arbiter.getFeatureTypesOnServer($(this).val());
		});
		
		/*jqAddLayerSubmit.mouseup(function(event){
			// featureNS, serverUrl, typeName, srsName, layernickname
			
			var args = {
				featureNS: "http://opengeo.org",
				serverUrl: $("#layerurl").val(),
				typeName: $("#layerselect").val(),
				srsName: "EPSG:4326",
				layernickname: "hospitals"
			};
									 
			arbiter.submitLayer(args);
		});*/
		
		jqCreateFeature.mouseup(function(event){
			if(addFeatureControl.active){
				addFeatureControl.deactivate();
				$(this).removeClass("ui-btn-active");
			}else{
				addFeatureControl.activate();
				$(this).addClass("ui-btn-active");
			}
		});
		
		jqAddFeature.mouseup(function(event){
			console.log("Add Feature");
		});
		
		jqEditFeature.mouseup(function(event){
			console.log("Edit Feature");
		});
		
		jqEditorTab.mouseup(function(event){
			//arbiter.pullFeatures(false);
			arbiter.ToggleEditorMenu();
		});
		
		$(".layer-list-item").mouseup(function(event){
			arbiter.populateAddLayerDialog($(this).text());
		});
		
		$(".server-list-item").mouseup(function(event){
			arbiter.populateAddServerDialog($(this).text());
		});
		
		//this.GetFeatures("SELECT * FROM \"Feature\"");
		console.log("Now go spartan, I shall remain here.");
    },
	
	ToggleEditorMenu: function() {
		if(!editorOpen) {
			this.OpenEditorMenu();
		} else {
			this.CloseEditorMenu();
		}
	},

	OpenEditorMenu: function() {
		editorOpen = true;
		$("#idEditorMenu").animate({ "left": "72px" }, 50);
		var width;
		
		if(this.isOrientationPortrait()) {
			width = screen.width - 72;
		} else {
			width = screen.height - 72;
		}
		$("#editorTab").animate({ "right": width }, 50);
	},
	
	CloseEditorMenu:function() {
		editorOpen = false;
		$("#idEditorMenu").animate({ "left": "100%" }, 50);
		$("#editorTab").animate({ "right": "0px" }, 50);
	},
	
	PopulateProjectsList: function() {
		//Fill the projects list (id=idProjectsList) with the ones that are available.
		// - Make the div's id = to ProjectID number;
		// Example: <a data-role="button" id="1" onClick="Arbiter.onClick_OpenProject(this)">TempProject</a>
		console.log("PopulateProjectsList");
		jqProjectsList.listview("refresh");
		//jqProjectsList.listview('refresh');
		//TODO: Load projects that are available
		// - add them to the ProjectsList
	},
	
	onClick_EditProjects: function() {
		//TODO: Make the Projects List editable
		console.log("User wants to edit his/her projects.");
	},
	
	PopulateServersList: function() {
		//Fill the servers list (id=idServersList) with the ones that are available.
		// - Make the div's id = to ServerID number;
		console.log("PopulateServersList");
		
		//TODO: Load servers that are available
		// - add them to the ServersList
	},
	
	appendToListView: function(_item, _listview, _mouseup){
		$(_item).appendTo(_listview).mouseup(_mouseup);
		
		if(_listview.hasClass('ui-listview'))
			_listview.listview("refresh");
		
		_listview.children(':first-child').addClass('ui-corner-top');
		_listview.children(':last-child').addClass('ui-corner-bottom');
	},
	
	InitializeProjectList: function(dirEntry){
		var arbiter = this;
		
		var directoryReader = dirEntry.createReader();
		
		
		var success = function(entries){
			var li;
			
			for(var i = 0; i < entries.length;i++){
				li = '<li><a class="project-list-view">' + entries[i].name + '</a></li>';
				
				arbiter.appendToListView(li, jqProjectsList, function(event){
					arbiter.setCurrentProject($(this).find('a').text(), arbiter);
				});
			}
		};
		
		var fail = function(error){
			console.log("Failed to list directory contents: " + error.code);
		};
		
		directoryReader.readEntries(success, fail);
	},
	
	setCurrentProject: function(projectName, arbiter){
		console.log("setcurrentproject: " + projectName + ".");
		arbiter.currentProject = {};
		
		arbiter.currentProject.name = projectName;
		arbiter.currentProject.serverList = {};
		
		//set dataDatabase and variablesDatabase
		arbiter.currentProject.variablesDatabase = Cordova.openDatabase("Projects/" + arbiter.currentProject.name + "/variables", "1.0", "Variable Database", 1000000);
		arbiter.currentProject.dataDatabase = Cordova.openDatabase("Projects/" + arbiter.currentProject.name + "/data", "1.0", "Data Database", 1000000);
		
		arbiter.currentProject.variablesDatabase.transaction(function(tx){
			//select servers and add to the project
			tx.executeSql("SELECT * FROM servers;", [], function(tx, res){
				var serverObj;
				for(var i = 0; i < res.rows.length; i++){
					serverObj = res.rows.item(i);
						  console.log(serverObj);
						  console.log("before setting serverList");
					arbiter.currentProject.serverList[serverObj.name] = {
						  layers: {},
						  password: serverObj.password,
						  url: serverObj.url,
						  username: serverObj.username
					};
					
					var _serverId = serverObj.id;
					arbiter.currentProject.variablesDatabase.transaction(function(tx){
						var serverName = serverObj.name;
						var serverId = serverObj.id;												 
						console.log("server: " + serverName + " - " + serverId);
						console.log("SELECT * FROM layers where server_id=" + serverId);
						tx.executeSql("SELECT * FROM layers where server_id=" + serverId, [], function(tx, res){
							var layer;
							var table_name;
									  
							for(var j = 0; j < res.rows.length; j++){
								console.log("server name: " + serverName + " - " + serverId);
								layer = res.rows.item(j);
								arbiter.currentProject.serverList[serverName].layers[layer.layername] = {
									featureNS: layer.featureNS,
									featureType: layer.f_table_name,
									typeName: layer.typeWithPrefix,
									attributes: []
								};
									
								table_name = layer.f_table_name;
								arbiter.currentProject.dataDatabase.transaction(function(tx){
									var geomColumnsSql = "SELECT * FROM geometry_columns where f_table_name='" + table_name + "';";
									
									tx.executeSql(geomColumnsSql, [], function(tx, res){
										var geomName;
										
										if(res.rows.length){ //should only be 1 right now
											geomName = res.rows.item(0).f_geometry_column;
												
											arbiter.currentProject.dataDatabase.transaction(function(tx){
												var tableSelectSql = "PRAGMA table_info (" + table_name + ");";
																						
												arbiter.currentProject.serverList[serverName].layers[layer.layername].geomName = geomName;
												arbiter.currentProject.serverList[serverName].layers[layer.layername].srsName = res.rows.item(0).srid;
												arbiter.currentProject.serverList[serverName].layers[layer.layername].geometryType = res.rows.item(0).geometry_type;
												
												tx.executeSql(tableSelectSql, [], function(tx, res){
													var attrName;
													for(var h = 0; h < res.rows.length;h++){
														attrName = res.rows.item(h).name;
														console.log("geomName: " + geomName);
														if(attrName != 'fid' && attrName != geomName)
															arbiter.currentProject.serverList[serverName].layers[layer.layername].attributes.push(res.rows.item(h).name);
														}
													});													  
											}, arbiter.errorSql, function(){});
										}
									});
								}, arbiter.errorSql, function(){});
							}
						});
																		 
					}, arbiter.errorSql, function(){});
				}
			});
			
			//select layers and add to the project
															 
			//select area of interest and add to the project
			
		}, arbiter.errorSql, function(){});
		
		//set aoi
		
		//set serverList
	},
	
	onClick_EditServers: function() {
		//TODO: Make the servers List editable
		console.log("User wants to edit his/her servers.");
	},
	
	validateAddServerFields: function(){
		var username = jqNewUsername.val();
		var password = jqNewPassword.val();
		var nickname = jqNewNickname.val();
		var url = jqNewServerURL.val();
		var valid = true;
		
		if(!username){
			jqNewUsername.addClass('invalid-field');
			valid = false;
		}else
			jqNewUsername.removeClass('invalid-field');
		
		if(!password){
			jqNewPassword.addClass('invalid-field');
			valid = false;
		}else
			jqNewPassword.removeClass('invalid-field');
		
		if(!nickname){
			jqNewNickname.addClass('invalid-field');
			valid = false;
		}else if(this.currentProject.serverList[nickname]){
			jqNewNickname.addClass('invalid-field');
			jqNewNickname.val("");
			jqNewNickname.attr("placeholder", "Choose another Nickname *");
			valid = false;
		}else{
			jqNewNickname.removeClass('invalid-field');
		}
		
		if(!url){
			jqNewServerURL.addClass('invalid-field');
			valid = false;
		}else
			jqNewServerURL.removeClass('invalid-field');
		
		return valid;
	},
	
	checkCacheControl: function(cacheControl, url, username, password){
		if(cacheControl && (cacheControl.indexOf("must-revalidate") != -1)){
			jqNewUsername.addClass('invalid-field');
			jqNewPassword.addClass('invalid-field');
			jqNewPassword.val("");
		}else{
			jqNewUsername.removeClass('invalid-field');
			jqNewPassword.removeClass('invalid-field');
			
			var name = jqNewNickname.val();
			
			this.currentProject.serverList[name] = {
				url: url,
				username: username,
				password: password,
				layers: {}
			};
			
			$("ul#idServersList").append("<li><a href='#' class='server-list-item'>" + name + "</a></li>").listview('refresh');
			var option = '<option value="' + name + '">' + name + '</option>';
			jqServerSelect.append(option);
			
			if(jqServerSelect.parent().parent().hasClass('ui-select'))
				jqServerSelect.selectmenu('refresh', true);
			
			jqAddServerButton.removeClass('ui-btn-active');
			//this.changePage_Pop(div_ServersPage);
			window.history.back();
		}
	},
	
	authenticateServer: function(url, username, password){
		var arbiter = this;
		$.post(url + "/j_spring_security_check", {username: username, password: password}, function(results, textStatus, jqXHR){
			arbiter.checkCacheControl(jqXHR.getResponseHeader("cache-control"), url, username, password);
		}).error(function(err){ //seems to require request to the server before it actually can find it
			$.post(url + "/j_spring_security_check", {username: username, password: password}, function(results, textStatus, jqXHR){
				arbiter.checkCacheControl(jqXHR.getResponseHeader("cache-control"), url, username, password);
			});
		});
	},
	
	onClick_AddServer: function() {
		//TODO: Add the new server to the server list
		console.log("User wants to submit a new servers.");
		var url = jqNewServerURL.val();
		var username = jqNewUsername.val();
		var password = jqNewPassword.val();
		
		if(this.validateAddServerFields()){
			this.authenticateServer(url, username, password);
		}
	},
	
	PopulateLayersList: function() {
		//Fill the servers list (id=idLayersList) with the ones that are available.
		// - Make the div's id = to some number...idk;
		console.log("PopulateLayersList");
	
		//TODO: Load layers that are available
		// - add them to the LayersList
	},
	
	onClick_EditLayers: function() {
		//TODO: Make the servers List editable
		console.log("User wants to edit his/her layers.");
	},
	
	createMetaTables: function(tx){
		var createServersSql = "CREATE TABLE IF NOT EXISTS servers (id integer primary key, name text not null, url text not null, " +
		"username text not null, password text not null);";
		
		var createDirtyTableSql = "CREATE TABLE IF NOT EXISTS dirty_table (id integer primary key, f_table_name text not null, fid text not null);";
		
		var createSettingsTableSql = "CREATE TABLE IF NOT EXISTS settings (id integer primary key, language text not null, aoi_left text not null, " +
		"aoi_bottom text not null, aoi_right text not null, aoi_top text not null);";
		
		var createLayersTableSql = "CREATE TABLE IF NOT EXISTS layers (id integer primary key, server_id integer, " + 
		"layername text not null, f_table_name text not null, featureNS text not null, typeWithPrefix text not null, " +
		"FOREIGN KEY(server_id) REFERENCES servers(id));";
		
		tx.executeSql(createServersSql);
		
		tx.executeSql(createDirtyTableSql);
		
		tx.executeSql(createSettingsTableSql);
		
		tx.executeSql(createLayersTableSql);
	},
	
	createDataTables: function(tx){
		
		var createGeometryColumnsSql = "CREATE TABLE IF NOT EXISTS geometry_columns (f_table_name text not null, " +
		"f_geometry_column text not null, geometry_type text not null, srid text not null, " +
		"PRIMARY KEY(f_table_name, f_geometry_column));";
		
		tx.executeSql(createGeometryColumnsSql);
	},
	
	onClick_AddProject: function() {
		
		//Create a directory for the project
		
		//Create a database for the data and a database for the metadata
		
		//Write the project to the databases
		
		this.currentProject.aoi = aoiMap.getExtent();
		
		var arbiter = this;
		
		var insertCurrentProject = function(tx){
			var insertServerSql;
			var serverList = arbiter.currentProject.serverList;
			
			var insertSettingsSql = "INSERT INTO settings (language, aoi_left, aoi_bottom, aoi_right, aoi_top) VALUES ('ENGLISH', " + 
			arbiter.squote(arbiter.currentProject.aoi.left) + ", " + arbiter.squote(arbiter.currentProject.aoi.bottom) +
			", " + arbiter.squote(arbiter.currentProject.aoi.right) + ", " + arbiter.squote(arbiter.currentProject.aoi.top) + ");";
			
			tx.executeSql(insertSettingsSql);
			
			for(var x in serverList){
				arbiter.currentProject.variablesDatabase.transaction(function(tx){
					insertServerSql = "INSERT INTO servers (name, url, username, password) VALUES " +
						"(" + arbiter.squote(x) + ", " + arbiter.squote(serverList[x].url) + ", " + 
						arbiter.squote(serverList[x].username) + ", " + arbiter.squote(serverList[x].password) + ");";
				
					var name = x;
					tx.executeSql(insertServerSql, [], function(tx, res){
						var insertLayerSql;
						var layer;
						var insertGeometryColumnRowSql;
						var createFeatureTableSql;
						var attributes;	
						
						for(var y in serverList[name].layers){
							layer = serverList[name].layers[y];
								  
							insertLayerSql = "INSERT INTO layers (server_id, layername, f_table_name, featureNS, typeWithPrefix) VALUES (" + res.insertId + 
								  ", " + arbiter.squote(y) + ", " + arbiter.squote(layer.featureType) + ", " + arbiter.squote(layer.featureNS) + 
								  ", " + arbiter.squote(layer.typeName) + ");";
							
							arbiter.currentProject.variablesDatabase.transaction(function(tx){
								tx.executeSql(insertLayerSql);															   
							}, arbiter.errorSql, function(){});
								  
							arbiter.currentProject.dataDatabase.transaction(function(tx){
								insertGeometryColumnRowSql = "INSERT INTO geometry_columns (f_table_name, " +
									"f_geometry_column, geometry_type, srid) VALUES (" + arbiter.squote(layer.featureType) + 
									", " + arbiter.squote(layer.geomName) + ", " + arbiter.squote(layer.geometryType) + 
									", " + arbiter.squote(layer.srsName) + ");";
																			
								attributes = "fid text primary key, " + layer.geomName + " text not null";
								
								for(var i = 0; i < layer.attributes.length; i++){
									attributes += ", " + layer.attributes[i] + " text not null";
								}
								
								createFeatureTableSql = "CREATE TABLE IF NOT EXISTS " + layer.featureType +
									" (" + attributes + ");";
									
																			console.log(createFeatureTableSql);
								tx.executeSql(insertGeometryColumnRowSql);
																			
								tx.executeSql(createFeatureTableSql);
							}, arbiter.errorSql, function(){});
						}
					});
				}, arbiter.errorSql, function(){});
			}
		};
		
		var writeToDatabases = function(dir){
			
			//Create the databases for that project
			arbiter.currentProject.variablesDatabase = Cordova.openDatabase("Projects/" + arbiter.currentProject.name + "/variables", "1.0", "Variable Database", 1000000);
			arbiter.currentProject.dataDatabase = Cordova.openDatabase("Projects/" + arbiter.currentProject.name + "/data", "1.0", "Data Database", 1000000);
			
			//Create the initial tables in each database
			arbiter.currentProject.variablesDatabase.transaction(arbiter.createMetaTables, arbiter.errorSql, function(){
				arbiter.currentProject.dataDatabase.transaction(arbiter.createDataTables, arbiter.errorSql, function(){
					//Transaction succeeded so both metadata and data tables exist
					arbiter.currentProject.variablesDatabase.transaction(insertCurrentProject, arbiter.errorSql, function(){
						//add to the list of projects on success
						var li = "<li><a class='project-list-item'>" + arbiter.currentProject.name + "</a></li>";
						
						arbiter.appendToListView(li, jqProjectsList, function(event){
							arbiter.setCurrentProject($(this).find('a').text(), arbiter);
						});
																		 
						arbiter.changePage_Pop(div_ProjectsPage);
					});
				});
			});
		};
		
		var error = function(error){
			console.log("error creating directory");
		};
		
		console.log('"' + this.currentProject.name + '"');
					
		this.fileSystem.root.getDirectory("Projects/" + this.currentProject.name, {create: true, exclusive: false}, writeToDatabases, error);
	},
	
	getProjectDirectory: function(_projectName, _successCallback, _errorCallback) {
		this.fileSystem.root.getDirectory(_projectName, null, _successCallback, _errorCallback);
	},
	
	failedGetProjectDirectory: function(error) {
		console.log("Failed to read Project Directory.");
	},
	
	parseProjectFromDirectory: function(_dir) {
		
	},
		
	validateAddLayerSubmit: function(){
		var valid = true;
		
		if(!jqServerSelect.val()){
			jqServerSelect.addClass('invalid-field');
			valid = false;
		}else{
			jqServerSelect.removeClass('invalid-field');
		}
		
		if(!jqLayerSelect.val()){
			jqLayerSelect.addClass('invalid-field');
			valid = false;
		}else{
			jqLayerSelect.removeClass('invalid-field');
		}
		
		if(!jqLayerNickname.val()){
			jqLayerNickname.addClass('invalid-field');
			valid = false;
		}else{
			jqLayerNickname.removeClass('invalid-field');
		}
		
		return valid;
	},
	
	submitLayer: function(){
		var valid = this.validateAddLayerSubmit();
		
		if(valid){
			var arbiter = this;
			var serverInfo = this.currentProject.serverList[jqServerSelect.val()];
			var typeName = jqLayerSelect.val();
			
			var request = new OpenLayers.Request.GET({
				url: serverInfo.url + "/wfs?service=wfs&version=1.1.0&request=DescribeFeatureType&typeName=" + typeName,
				callback: function(response){
					var obj = describeFeatureTypeReader.read(response.responseText);
										 
					var layerattributes = [];
					var geometryName = "";
					var geometryType = "";
					var featureType = "";
					var property;
													 
					/*right now just assuming that theres only 1 featureType*/
					
					//have the typeName from before, but this way we don't have to parse
					featureType = obj.featureTypes[0].typeName;
					
					for(var j = 0; j < obj.featureTypes[0].properties.length; j++){
						property = obj.featureTypes[0].properties[j];
						if(property.type.indexOf("gml:") >= 0){
							geometryName = property.name;
							geometryType = property.type.substring(4, property.type.indexOf('PropertyType')); 
						}else{
							layerattributes.push(property.name);						 
						}
					}
					
					var selectedOption = jqLayerSelect.find('option:selected');
					
					var layernickname = jqLayerNickname.val();
					serverInfo.layers[layernickname] = {
						featureNS: obj.targetNamespace,
						geomName: geometryName,
						geometryType: geometryType,
						featureType: featureType,
						typeName: typeName,
						srsName: selectedOption.attr('layersrs'),
						attributes: layerattributes
					};
						
					var li = "<li><a href='#' class='layer-list-item'>" + layernickname + "</a></li>";
													 
					$("ul#layer-list").append(li).listview("refresh");
													 
					jqLayerSubmit.removeClass('ui-btn-active');
					window.history.back();
				}
			});
		}
	},
	
	populateAddServerDialog: function(serverName){
		if(serverName){
			jqNewNickname.val(serverName);
			jqNewServerURL.val(this.currentProject.serverList[serverName].url);
			jqNewUsername.val(this.currentProject.serverList[serverName].username);
			jqNewPassword.val(this.currentProject.serverList[serverName].password);
		}else{
			jqNewNickname.val("");
			jqNewServerURL.val("");
			jqNewUsername.val("");
			jqNewPassword.val("");
			
			jqGoToAddServer.removeClass('ui-btn-active');
		}
		
		this.changePage_Pop(jqAddServerPage);
	},
	
	populateAddLayerDialog: function(layername){
		console.log("layername: " + layername);
		if(layername){
			var layers = map.getLayersByName(layername + "-wfs");
			if(layers.length){
				var protocol = layers[0].protocol;
				$("#featureNS").val(protocol.featureNS);
				$("#layerurl").val(protocol.url.substring(0, protocol.url.length - 4));
				$("#featureType").val(protocol.featureType);
				$("#layernickname").val(layername);
			}
		}else{
			$("#featureNS").val("");
			$("#layerurl").val("");
			$("#featureType").val("");
			$("#layernickname").val("");
		}
		
		$.mobile.changePage("#addLayerDialog", "pop");
	},
	
	//override: Bool, should override
	pullFeatures: function(override){
		var arbiter = this;
		var currentBounds = map.calculateBounds().transform(WGS84_Google_Mercator, WGS84);
		
		var featureType = 'opengeo:hospitals_try';
		var propertyName = 'geom';
		var postData = '<wfs:GetFeature service="WFS" version="1.0.0" outputFormat="GML2" ' +
		'xmlns:usa="http://usa.opengeo.org" xmlns:wfs="http://www.opengis.net/wfs" ' +
		'xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml" ' +
		'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs ' +
		'http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd"> ' +
		'<wfs:Query typeName="' + featureType + '">' +
		'<ogc:Filter>' +
		'<ogc:BBOX>' +
		'<ogc:PropertyName>' + propertyName + '</ogc:PropertyName>' +
		'<gml:Box srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
		'<gml:coordinates>' + currentBounds.left + ',' + currentBounds.bottom +
		' ' + currentBounds.right + ',' + currentBounds.top + '</gml:coordinates>' +
		'</gml:Box>' +
		'</ogc:BBOX>' +
		'</ogc:Filter>' +
		'</wfs:Query>' +
		'</wfs:GetFeature>';
		
		var request = new OpenLayers.Request.POST({
			url: map.layers[2].protocol.url,
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
					if(!map.layers[2].getFeatureByFid(features[i].fid) || override){
						features[i].geometry.transform(WGS84, WGS84_Google_Mercator);
						arbiter.insertFeaturesIntoTable(arbiter.serversDatabase, [features[i]], "hospitals");
						map.layers[2].addFeatures([features[i]]);
					}
				}
			},
			failure: function(response){
				console.log('something went wrong');
			}
		});	
	},
	
	enableLayerSelectAndNickname: function(){
		jqLayerSelect.parent().removeClass('ui-disabled').removeAttr('aria-disabled');
		jqLayerSelect.removeAttr('aria-disabled disabled').removeClass('mobile-selectmenu-disabled ui-state-disabled');
		
		jqLayerNickname.removeAttr('disabled');
	},
	
	disableLayerSelectAndNickname: function(){
		jqLayerSelect.parent().addClass('ui-disabled').attr('aria-disabled', 'true');
		jqLayerSelect.attr('disabled', 'disabled').attr('aria-disabled', 'true').addClass('mobile-selectmenu-disabled ui-state-disabled');
		
		jqLayerNickname.attr('disabled', 'disabled');
	},
	
	getFeatureTypesOnServer: function(serverName){
		
		var arbiter = this;
		var serverInfo = arbiter.currentProject.serverList[serverName];
		var request = new OpenLayers.Request.GET({
			url: serverInfo.url + "/wms?request=getCapabilities",
			user: serverInfo.username,
			password: serverInfo.password,
			callback: function(response){
				var capes = capabilitiesFormatter.read(response.responseText);
				var options = "";
				
				if(capes && capes.capability && capes.capability.layers){
					var layer;
					var layersrs;
					
					for(var i = 0;i < capes.capability.layers.length;i++){
						layer = capes.capability.layers[i];
						
						//Get the layers srs
						for(var x in layer.bbox){
							if(x.indexOf('EPSG') != -1){
								layersrs = x;
								break;
							}
						}
						
						options += '<option layersrs="' + layersrs + '" value="' + 
							layer.name + '">' + layer.title + '</option>';
					}
												 
					jqLayerSelect.html(options).selectmenu('refresh', true);
					
					arbiter.enableLayerSelectAndNickname();
				}
			}
		});
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
		this.changePage_Pop(div_ProjectsPage);
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
		
	/*
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
	*/
	
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
								
								console.log(updatesql);
										   try{
										   console.log(clonedfeature);
										   }catch(err){
										   console.log("update undefined");
										   }
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
							
							  console.log(insertsql);
							  try{
							  console.log(clonedfeature);
							  }catch(err){
							  console.log("insert undefined");
							  }
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
	 		featureType, //e.g. hospitals
	 		typeName, //e.g. medford:hospitals
	 		srsName,
	 		nickname,
	 		username,
	 		password,
	 		alreadyIn
	 	}
	 */
	AddLayer: function(meta){
		if(meta.url && meta.featureNS && meta.featureType
			&& meta.srsName && meta.nickname && meta.username
			&& meta.password && meta.typeName && meta.geomName){ // theres no wfs layer for that layer yet
			
			
			var arbiter = this;
				
			var encodedCredentials = $.base64.encode(meta.username + ':' + meta.password);
				
			var protocol = new OpenLayers.Protocol.WFS({
				version: "1.0.0",
				url : meta.url + "/wfs",
				featureNS : meta.featureNS,
				geometryName : meta.geomName,
				featureType : meta.featureType,
				srsName: meta.srsName,
				headers: {
					Authorization: 'Basic ' + encodedCredentials	
				}
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
				layers: meta.typeName,
				transparent: 'TRUE'
			});
			
			map.addLayers([newWMSLayer, newWFSLayer]);
			
			newWFSLayer.events.register("featuremodified", null, function(event){
				arbiter.insertFeaturesIntoTable(arbiter.serversDatabase, [event.feature], meta.nickname);
			});
			
			newWFSLayer.events.register("featureselected", null, function(event){
				console.log(event);
				selectedFeature = event.feature;
			});
			
			saveStrategy.events.register("success", '', function(event){
				
				console.log("save success: ", event);
				//Update the wmsLayer with the save
				newWMSLayer.mergeNewParams({
					'ver' : Math.random() // override browser caching
				});
				
				newWMSLayer.redraw(true);
				
				//map.layers[2].destroyFeatures();
				//arbiter.pullFeatures(true);
				//Remove the features for this layer from the table keeping track of dirty features
				arbiter.variableDatabase.transaction(function(tx){
					tx.executeSql("DELETE FROM " + modifiedTable + " WHERE layer='" + tableName + "';", [], 
								  function(){}, function(tx, err){
								  console.log("error: ", err);
								  });															  
				}, arbiter.errorSql, function(){console.log("delete success");});
			});
			
			var modifyControl = new OpenLayers.Control.ModifyFeature(newWFSLayer);
			
			addFeatureControl = new OpenLayers.Control.DrawFeature(newWFSLayer,OpenLayers.Handler.Point);
			addFeatureControl.events.register("featureadded", null, function(event){
				event.feature.attributes.name = "";
				arbiter.insertFeaturesIntoTable(arbiter.serversDatabase, [event.feature], "hospitals");	
			});
			
			map.addControl(addFeatureControl);
			
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
			
			var li = "<li><a href='#' class='layer-list-item'>" + meta.nickname + "</a></li>";
			
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
	
	changePage_Pop: function(_div) {
		$.mobile.changePage(_div, "pop");
	},
	
	getOrientation: function() {
		return window.orientation;
	},
	
	/*
	 Returns true if the application is in Landscape mode.
	 */
	isOrientationLandscape: function() {
		if(this.getOrientation() == 90 || this.getOrientation() == -90)
			return true;
		else
			return false;
	},
	
	/*
	 Returns true if the application is in Portrait mode.
	 */
	isOrientationPortrait: function() {
		if(this.getOrientation() == 0 || this.getOrientation() == 180)
			return true;
		else
			return false;
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