
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
var div_AddLayersPage;
var div_EditLayersPage;
var div_AreaOfInterestPage;
var div_ArbiterSettingsPage;
var div_ProjectSettingsPage;
var div_Popup;
var div_EditServerPage;
var jqSaveButton;
var jqAttributesButton;
var jqLayerURL;
var jqCreateFeature;
var jqNewProjectName;
var jqToServersButton;
var jqNewUsername;
var jqNewPassword;
var jqNewNickname;
var jqNewServerURL;
var jqAddServerButton;
var jqEditUsername;
var jqEditPassword;
var jqEditNickname;
var jqEditServerURL;
var jqEditServerButton;
var jqGoToAddServer;
var jqAddServerPage;
var jqServerSelect;
var jqEditServerSelect;
var jqLayerSelect;
var jqEditLayerSelect;
var jqLayerNickname;
var jqEditLayerNickname;
var jqLayerSubmit;
var jqProjectsList;
var jqEditorTab;
var jqAttributeTab;
var jqExistingServers;
var jqAddFeature;
var jqEditFeature;
var jqSyncUpdates;


var tempLayerToEdit = null;
var fileSystem = null;

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

var tabOpen = false;
var editorTabOpen = false;
var attributeTabOpen = false;

var Arbiter = {
	
	fileSystem: null,
	
	globalDatabase: null,
	
	tilesetsDatabase: null, 
	
	serverList: {},
	
	currentProject: {
		name: "default",
		aoi: null,
		variablesDatabase: null,
		dataDatabase: null,
		serverList: {}
	},

	isOnline: false,
	
    Initialize: function() {
		console.log("What will you have your Arbiter do?"); // http://www.youtube.com/watch?v=nhcHoUj4GlQ
		
		Cordova.Initialize(this);
        
		var arbiter = this;
		
		//Save divs for later
		div_MapPage 		= $('#idMapPage');
		div_WelcomePage		= $('#idWelcomePage');
		div_ProjectsPage	= $('#idProjectsPage');
		div_NewProjectPage	= $('#idNewProjectPage');
		div_ServersPage		= $('#idServersPage');
		div_LayersPage		= $('#idLayersPage');
		div_AddLayersPage	= $('#idAddLayerPage');
		div_EditLayersPage	= $('#idEditLayerPage');
		div_AreaOfInterestPage = $('#idAreaOfInterestPage');
		div_ArbiterSettingsPage	= $('#idArbiterSettingsPage');
		div_ProjectSettingsPage	= $('#idProjectSettingsPage');
		div_Popup			= $('#popup');
		div_EditServerPage = $('#idEditServersPage');
		jqSaveButton = $('#saveButton');
		jqAttributesButton = $('#attributesButton');
		jqLayerURL = $('#layerurl');
		jqCreateFeature = $('#createFeature');
		jqNewProjectName = $('#newProjectName');
		jqToServersButton = $('#toServersButton');
		jqNewUsername = $('#newUsername');
		jqNewPassword = $('#newPassword');
		jqNewNickname = $('#newNickname');
		jqNewServerURL = $('#newServerURL');
		jqAddServerButton = $('#addServerButton');
		jqEditUsername = $('#editUsername');
		jqEditPassword = $('#editPassword');
		jqEditNickname = $('#editNickname');
		jqEditServerURL = $('#editServerURL');
		jqEditServerButton = $('#editServerButton');
		jqGoToAddServer = $('#goToAddServer');
		jqAddServerPage = $('#idAddServerPage');
		jqServerSelect = $('#serverselect');
		jqEditServerSelect = $('#Edit_serverselect');
		jqExistingServers = $('#existingServers');
		jqLayerSelect = $('#layerselect');
		jqEditLayerSelect = $('#Edit_layerselect');
		jqLayerNickname = $('#layernickname');
		jqEditLayerNickname = $('#Edit_layernickname');
		jqLayerSubmit = $('#addLayerSubmit');
		jqProjectsList = $('ul#idProjectsList');
		jqEditorTab = $('#editorTab');
		jqAttributeTab = $('#attributeTab');
		jqAddFeature	 = $('#addPointFeature');
		jqEditFeature	 = $('#editPointFeature');
		jqSyncUpdates	 = $('#syncUpdates');
		jqServersPageContent = $('#idServersPageContent');
		div_ProjectsPage.live('pageshow', this.PopulateProjectsList);
		div_ServersPage.live('pageshow', this.PopulateServersList);
		div_LayersPage.live('pageshow', this.PopulateLayersList);
		
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(filesystem){
			arbiter.fileSystem = filesystem;
			
			arbiter.fileSystem.root.getDirectory("Arbiter", {create: true, exclusive: false}, function(dir){
				console.log("created arbiter directory");
				
				arbiter.fileSystem.root.getDirectory("Arbiter/Projects", {create: true, exclusive: false}, function(dir){
					console.log("created projects directory");
					arbiter.InitializeProjectList(dir);
				}, function(error){
					console.log("error getting projects");
				});
				
								
				arbiter.globalDatabase = Cordova.openDatabase("Arbiter/global", "1.0", "Global Database", 1000000);
				arbiter.globalDatabase.transaction(function(tx){
					
					var createSettingsSql = "CREATE TABLE IF NOT EXISTS settings (id integer primary key, language text not null);";
					tx.executeSql(createSettingsSql, [], function(tx, res){
						console.log("global settings table created");											 
					}, function(tx, err){
						console.log("global settings err: ", err);		  
					});
					
					var createServersSql = "CREATE TABLE IF NOT EXISTS servers (id integer primary key autoincrement, name text not null, url text not null, " +
												   "username text not null, password text not null);";
					   
					tx.executeSql(createServersSql, [], function(tx, res){
						console.log("global servers table created");											 
					}, function(tx, err){
						console.log("global servers err: ", err);		  
					});
												   
					var createServerUsageSql = "CREATE TABLE IF NOT EXISTS server_usage (id integer primary key, server_id integer, dirty integer, " +
												"FOREIGN KEY(server_id) REFERENCES servers(id));";

					tx.executeSql(createServerUsageSql, [], function(tx, res){
						console.log("global server_usage table created");											 
					}, function(tx, err){
						console.log("global server_usage err: ", err);		  
					});

					
					var createProjectsSql = "CREATE TABLE IF NOT EXISTS projects (id integer primary key, name text not null);";

					tx.executeSql(createProjectsSql, [], function(tx, res){
						console.log("global projects table created");
					}, function(tx, err){
						console.log("global projects table err: ", err);			  
					});

					// populate the existing servers drop down on the add server page
					tx.executeSql("SELECT * FROM servers;", [], function(tx, res){
						var row;
						var html = '';
						var contentClass;
						var leftClass;
						//var leftPositioning;
						
						for(var i = 0;i < res.rows.length;i++){
							row = res.rows.item(i);
							contentClass = 'existingServer-contentColumn';
							leftClass = 'existingServer-leftColumn';
							
							if(i == 0){
								contentClass += ' existingServer-top-right';
								leftClass += ' existingServer-top-left';
							}
							
							if(i == (res.rows.length - 1)){
								contentClass += ' existingServer-bottom-right';
								leftClass += ' existingServer-bottom-left';
							}
							
							//leftPositioning = -1 * (((row.name.length * 16) / 2) - 40);
							
							html += '<div class="existingServer-row">' +
							'<div class="existingServer-contentWrapper">' +
							'<div class="' + contentClass + '">' +
							'<a class="existingServer-name" id="existingServer-' + row.id + '">' + row.name + '</a>' +
							'</div>' +
							'</div>' +
							'<div class="' + leftClass + '">' +
							'<div class="existingServer-checkbox-container">' +
							'<input type="checkbox" class="existingServer-checkbox" server-id="' + row.id + '" name="' + row.name +
							'" id="existingServer-checkbox-' + row.id + '" style="width:20px;height:20px;" />' +
							'</div>' +
							'</div>' +
							'</div>';
						}
						
						jqServersPageContent.html(html);
						
					}, arbiter.errorSql, function(){});
					
					var createTilesSql = "CREATE TABLE IF NOT EXISTS tiles (" +
							"id integer primary key autoincrement, " +
							"tileset text not null, " +
							"z integer not null, " +
							"x integer not null, " +
							"y integer not null, " +
							"path text not null, " +
							"url text not null, " +
							"ref_counter integer not null);";
   
					tx.executeSql(createTilesSql, [], function(tx, res){
						console.log("global tiles table created");
					}, function(tx, err){
						console.log("global tiles table err: ", err);			  
					});
					

				}, arbiter.errorSql, function(){});
				
				
				
				// create the table that will store the tile sets across all
				// projects
				arbiter.tilesetsDatabase = Cordova.openDatabase("Arbiter/tilesets", "1.0", "Tilesets Database", 1000000);
				arbiter.tilesetsDatabase.transaction(function(tx){
					var createTileRefCounterSql = "CREATE TABLE IF NOT EXISTS tilesets (tilelevel_table text PRIMARY KEY, title text not null);";
					   
					tx.executeSql(createTileRefCounterSql, [], function(tx, res){
						console.log("tilesetsDatabase.tile_ref_counter table created");
					}, function(tx, err){
						console.log("tilesetsDatabase.tile_ref_counter table err: ", err);
					});
				}, arbiter.errorSql, function(){});
				
			}, function(error){
				console.log("couldn't create arbiter directory");
			});
			
		}, function(error){
			console.log("requestFileSystem failed with error code: " + error.code);					 
		});
		
		div_AddLayersPage.live('pageshow', this.resetAddLayersPage);
		div_EditLayersPage.live('pageshow', this.resetEditLayersPage);
		
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
				transitionEffect : 'resize',
				singleTile : false,
				ratio : 1.3671875,
				isBaseLayer : true,
				visibility : true,
				getURL : TileUtil.getURL
			}			
		);
		
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
				
				var serverList = arbiter.currentProject.serverList;
				var url;
				var username;
				var password;
				var layers;
				var li = "";
				var radioNumber = 1;
						 
				for(var x in serverList){
					layers = serverList[x].layers;
					for(var y in layers){
						//add the wms and wfs layers to the map
						arbiter.AddLayer({
							featureNS: layers[y].featureNS,
							url: serverList[x].url,
							geomName: layers[y].geomName,
							featureType: layers[y].featureType, //e.g. hospitals
							typeName: layers[y].typeName, //e.g. medford:hospitals
							srsName: layers[y].srsName,
							nickname: y,
							username: serverList[x].username,
							password: serverList[x].password,
							serverName: x
						});
						
						li += "<li style='padding:5px; border-radius: 4px;'>";
						li += "<input type='radio' name='radio-choice' id='" + y;
						li += "' value='choice-";
						li += radioNumber + "'";
						
						if(radioNumber == 1) {
							li += "checked='checked'/>";
							arbiter.currentProject.activeLayer = y;
							arbiter.currentProject.modifyControls[arbiter.currentProject.activeLayer].modifyControl.activate();
						} else {
						 	li += "/>";
						}
						li += "<label for='radio-choice-" + radioNumber + "'>";
						li += x + " / " + y;
						li += "</label>";
						radioNumber++;
						 
						//add the data from local storage
						arbiter.readLayerFromDb(layers[y].featureType, y, layers[y].geomName, layers[y].srsName);
					}
				}
						 
				$("ul#editor-layer-list").empty().append(li).listview("refresh");
				
				$("input[type='radio']").bind( "change", function(event, ui) {
					console.log("Radio Change");
					console.log($("input[type=radio]:checked").attr('id'));
					
					arbiter.currentProject.modifyControls[arbiter.currentProject.activeLayer].modifyControl.deactivate();
					arbiter.currentProject.activeLayer = $("input[type=radio]:checked").attr('id');
					arbiter.currentProject.modifyControls[arbiter.currentProject.activeLayer].modifyControl.activate();
				});
			}
			
			$('#projectName').text(arbiter.currentProject.name);
			arbiter.setSyncColor();
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

		$('#idAddLayerPage').live('pagebeforeshow', function(){
			//populate the servers drop down from the currentProject.serverList
			var html = '<option value="" data-localize="label.chooseAServer">Choose a Server...</option>';
			
			for(var x in arbiter.currentProject.serverList){
				html += '<option value="' + x + '">' + x + '</option>';
			}
			
			jqServerSelect.html(html);
		});
		
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
				arbiter.fileSystem.root.getDirectory("Arbiter/Projects/" + jqNewProjectName.val(), null, projectAlreadyExists, projectDoesntExist);
			else{
				jqNewProjectName.addClass('invalid-field');
				jqToServersButton.removeClass('ui-btn-active');
			}
		});
		
		jqServerSelect.change(function(event){
			var serverName = $(this).val();
			if(serverName)
				arbiter.getFeatureTypesOnServer(serverName);
			else{
				jqLayerSelect.html('<option value="" data-localize="label.chooseALayer">Choose a layer...</option>');
				jqLayerSelect.selectmenu('refresh', true);
				jqLayerNickname.val('');
				arbiter.disableLayerSelectAndNickname();
			}
		});

		jqEditServerSelect.change(function(event){
			//var serverUrl = $(this).val();
							  console.log($(this).val());
			arbiter.getFeatureTypesOnServer($(this).val());
		});

		jqLayerSelect.change(function(event){
			//jqLayerNickname.val(jqLayerSelect.find('option:selected').text());
		});
		
		jqEditLayerSelect.change(function(event){
			//jqEditLayerNickname.val(jqEditLayerSelect.find('option:selected').text());
		});
		
		jqAddFeature.mouseup(function(event){
			console.log("Add Feature");
			if(arbiter.currentProject.activeLayer){
				var addFeatureControl = arbiter.currentProject.modifyControls[arbiter.currentProject.activeLayer].insertControl;
				if(addFeatureControl.active){
					addFeatureControl.deactivate();
					$(this).removeClass("ui-btn-active");
				}else{
					addFeatureControl.activate();
					$(this).addClass("ui-btn-active");
				}
			}
		});
		
		jqEditFeature.mouseup(function(event){
			console.log("Edit Feature");
		});
		
		jqSyncUpdates.mouseup(function(event){
			console.log("Sync Updates");
			var layers = map.getLayersByClass('OpenLayers.Layer.Vector');
						
			for(var i = 0; i < layers.length;i++){
				layers[i].strategies[0].save();
			}
			
			TileUtil.startCachingTiles();
		});
		
		jqEditorTab.mouseup(function(event){
			//arbiter.pullFeatures(false);
			arbiter.ToggleEditorMenu();
		});
		
		jqAttributeTab.mouseup(function(event){
			arbiter.ToggleAttributeMenu();
		});
		
		$(".layer-list-item").mouseup(function(event){
			arbiter.populateAddLayerDialog($(this).text());
		});
		
		$(".server-list-item").mouseup(function(event){
			arbiter.populateAddServerDialog($(this).text());
		});
		
		$(".existingServer-checkbox").live('click', function(event){
			var element = $(this);
			var id = element.attr('server-id');			
			var name = element.attr('name');
										   
			if(element.is(":checked")){ // if checked, add the server to the projects serverList
				arbiter.globalDatabase.transaction(function(tx){
					tx.executeSql("SELECT * FROM servers WHERE id=?;", [id], function(tx, res){
						if(res.rows.length){
							var row = res.rows.item(0);
								  
							arbiter.currentProject.serverList[row.name] = {
								layers: {},
								password: row.password,
								url: row.url,
								username: row.username,
								serverId: row.id
							};
						}
					}, function(tx, err){
																 
					});
				}, arbiter.errorSql, function(){});
			}else{
				delete arbiter.currentProject.serverList[name];								
			}
		});
		
		$('.existingServer-contentColumn').live('mouseup', function(event){
			var element = $(this);
			var name = element.find('a').text();
												
			arbiter.globalDatabase.transaction(function(tx){
				tx.executeSql("SELECT * FROM servers WHERE name=?;", [name], function(tx, res){
					if(res.rows.length){
						var row = res.rows.item(0);
							  
						jqEditUsername.val(row.username);
						jqEditPassword.val(row.password);
						jqEditNickname.val(row.name);
						jqEditServerURL.val(row.url);
						jqEditServerButton.attr('server-id', row.id);
					}
							  
					$.mobile.changePage('#idEditServerPage', 'pop');
				});
			}, arbiter.errorSql, function(){});
		});
		
		//this.GetFeatures("SELECT * FROM \"Feature\"");
		console.log("Now go spartan, I shall remain here.");
    },
	
	ToggleEditorMenu: function() {
		if(!editorTabOpen) {
			this.OpenEditorMenu();
		} else {
			this.CloseEditorMenu();
		}
	},
	
	ToggleAttributeMenu: function() {
		if(!attributeTab) {
			this.OpenAttributesMenu();
		} else {
			this.CloseAttributesMenu();
			
			if(attributeTab) {
				if(selectedFeature) {
					arbiter.newWFSLayer.unselected(selectedFeature);
				}
			}
		}
	},

	OpenEditorMenu: function() {
		editorTabOpen = true;
		$("#idEditorMenu").animate({ "left": "72px" }, 50);
		var width;
		
		if(this.isOrientationPortrait()) {
			width = screen.width - 72;
		} else {
			width = screen.height - 72;
		}
		$("#editorTab").animate({ "right": width }, 50);
		$("#attributeTab").animate({ "opacity": "0.0" }, 0);
	},
	
	CloseEditorMenu:function() {
		editorTabOpen = false;
		$("#idEditorMenu").animate({ "left": "100%" }, 50);
		$("#editorTab").animate({ "right": "0px" }, 50);
		$("#attributeTab").animate({ "opacity": "1.0" }, 0);
	},
	
	OpenAttributesMenu: function() {
		attributeTab = true;
		$("#idAttributeMenu").animate({ "left": "72px" }, 50);
		var width;
		
		if(this.isOrientationPortrait()) {
			width = screen.width - 72;
		} else {
			width = screen.height - 72;
		}
		$("#attributeTab").animate({ "right": width }, 50);
		$("#editorTab").animate({ "opacity": "0.0" }, 0);
		
		this.PopulatePopup();
	},
	
	CloseAttributesMenu: function() {
		attributeTab = false;
		$("#idAttributeMenu").animate({ "left": "100%" }, 50);
		$("#attributeTab").animate({ "right": "0px" }, 50);
		$("#editorTab").animate({ "opacity": "1.0" }, 0);
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
		arbiter.currentProject.modifyControls = {};
		
		//set dataDatabase and variablesDatabase
		arbiter.currentProject.variablesDatabase = Cordova.openDatabase("Arbiter/Projects/" + arbiter.currentProject.name + "/variables", "1.0", "Variable Database", 1000000);
		arbiter.currentProject.dataDatabase = Cordova.openDatabase("Arbiter/Projects/" + arbiter.currentProject.name + "/data", "1.0", "Data Database", 1000000);
		
		arbiter.currentProject.variablesDatabase.transaction(function(tx){
			//select servers and add to the project
			tx.executeSql("SELECT * FROM servers;", [], function(tx, res){
				var serverObj;
				for(var i = 0; i < res.rows.length; i++){
					serverObj = res.rows.item(i);
					console.log(serverObj);
					console.log("before setting serverList");
					
					//query the global server table to get the server info
					arbiter.globalDatabase.transaction(function(tx){
						tx.executeSql("SELECT * FROM servers WHERE id=" + serverObj.server_id + ";", [], function(tx, res){
							if(res.rows.length){ //There should be one row that matches
								var serverObj = res.rows.item(0);
								arbiter.currentProject.serverList[serverObj.name] = {
									layers: {},
									password: serverObj.password,
									url: serverObj.url,
									username: serverObj.username,
									serverId: serverObj.id
								};
							  
							  	//select layers and add to the appropriate server
								var _serverId = serverObj.id;
								arbiter.currentProject.variablesDatabase.transaction(function(tx){
									var serverName = serverObj.name;
									var serverId = serverObj.id;												 
									console.log("server: " + serverName + " - " + serverId);
									console.log("SELECT * FROM layers where server_id=" + serverId);
									tx.executeSql("SELECT * FROM layers where server_id=" + serverId, [], function(tx, res){
										var layer;
														 
										for(var j = 0; j < res.rows.length; j++){
											console.log("server name: " + serverName + " - " + serverId);
											layer = res.rows.item(j);
											arbiter.currentProject.serverList[serverName].layers[layer.layername] = {
												featureNS: layer.featureNS,
												featureType: layer.f_table_name,
												typeName: layer.typeWithPrefix,
												attributes: []
											};
														 
											//get the geometry name, type, and srs of the layer
											arbiter.currentProject.dataDatabase.transaction(function(tx){
												var layerObj = layer;
												var geomColumnsSql = "SELECT * FROM geometry_columns where f_table_name='" + layerObj.f_table_name + "';";
															 
												tx.executeSql(geomColumnsSql, [], function(tx, res){
													var geomName;
													var server = arbiter.currentProject.serverList[serverName];
													var serverLayer = server.layers[layerObj.layername];
															   
													if(res.rows.length){ //should only be 1 right now
														geomName = res.rows.item(0).f_geometry_column;
															   
														//get the attributes of the layer
														arbiter.currentProject.dataDatabase.transaction(function(tx){
															var tableSelectSql = "PRAGMA table_info (" + layerObj.f_table_name + ");";
																   
															serverLayer.geomName = geomName;
															serverLayer.srsName = res.rows.item(0).srid;
															serverLayer.geometryType = res.rows.item(0).geometry_type;
																   
															tx.executeSql(tableSelectSql, [], function(tx, res){
																var attrName;
																for(var h = 0; h < res.rows.length;h++){
																	attrName = res.rows.item(h).name;
																				 
																	if(attrName != 'fid' && attrName != geomName && attrName != 'id')
																		serverLayer.attributes.push(res.rows.item(h).name);
																}
															});													  
														}, arbiter.errorSql, function(){});
													}
												});
											}, arbiter.errorSql, function(){});
										}
														 
										arbiter.changePage_Pop(div_MapPage);
									});
										   
								}, arbiter.errorSql, function(){});
							}
						});
					}, arbiter.errorSql, function(){});
			}
		});
															 
			//select area of interest and add to the project
			tx.executeSql("SELECT * FROM settings;", [], function(tx, res){
				//should only be 1 row
				if(res.rows.length){
					var settings = res.rows.item(0);
					arbiter.currentProject.aoi = new OpenLayers.Bounds(
						settings.aoi_left, settings.aoi_bottom, settings.aoi_right, settings.aoi_top
					);
				}
			});
												
		}, arbiter.errorSql, function(){});
	},
	
	getAssociativeArraySize: function(obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	},
	
	/*
	 * args: {
	 *		jqusername,
	 *		jqpassword,
	 *		jqurl,
	 *		jqnickname,
	 *		func //either insert or update
	 * }
	 */
	validateAddServerFields: function(args){
		var username = args.jqusername.val();
		var password = args.jqpassword.val();
		var nickname = args.jqnickname.val();
		var url = args.jqurl.val();
		var valid = true;
		
		if(!username){
			args.jqusername.addClass('invalid-field');
			valid = false;
		}else
			args.jqusername.removeClass('invalid-field');
		
		if(!password){
			args.jqpassword.addClass('invalid-field');
			valid = false;
		}else
			args.jqpassword.removeClass('invalid-field');
		
		if(!nickname){
			args.jqnickname.addClass('invalid-field');
			valid = false;
		}else if(this.currentProject.serverList[nickname]){ //TODO: need to check the global db now
			args.jqnickname.addClass('invalid-field');
			args.jqnickname.val("");
			args.jqnickname.attr("placeholder", "Choose another Nickname *");
			valid = false;
		}else{
			args.jqnickname.removeClass('invalid-field');
		}
		
		if(!url){
			args.jqurl.addClass('invalid-field');
			valid = false;
		}else
			args.jqurl.removeClass('invalid-field');
		
		return valid;
	},
	
	//This should be checking the JSESSIONID cookie instead, but it doesn't seem like
	//we're getting it back even after authenticating
	/*
	 * args: {
	 *		jqusername,
	 *		jqpassword,
	 *		jqurl,
	 *		jqnickname,
	 *		func //either insert or update
	 * }
	 */
	checkCacheControl: function(cacheControl, args){
		 // Not authenticated
		if(cacheControl && (cacheControl.indexOf("must-revalidate") != -1)){
			args.jqusername.addClass('invalid-field');
			args.jqpassword.addClass('invalid-field');
			args.jqpassword.val("");
		}else{ //authenticated
			args.func.call(this);	
		}
	},
	
	/*
	 * args: {
	 *		jqusername,
	 *		jqpassword,
	 *		jqurl,
	 *		jqnickname,
	 *		func //either insert or update
	 * }
	 */
	authenticateServer: function(args){
		var arbiter = this;
		var username = args.jqusername.val();
		var password = args.jqpassword.val();
		var url = args.jqurl.val();
		
		$.post(url + "/j_spring_security_check", {username: username, password: password}, function(results, textStatus, jqXHR){
			arbiter.checkCacheControl(jqXHR.getResponseHeader("cache-control"), args);
		}).error(function(err){ //seems to require request to the server before it actually can find it
			$.post(url + "/j_spring_security_check", {username: username, password: password}, function(results, textStatus, jqXHR){
				arbiter.checkCacheControl(jqXHR.getResponseHeader("cache-control"), args);
			});
		});
	},
	
	onClick_AddServer: function() {
		//TODO: Add the new server to the server list
		console.log("User wants to submit a new servers.");

		var args = {
			jqusername: jqNewUsername,
			jqpassword: jqNewPassword,
			jqurl: jqNewServerURL,
			jqnickname: jqNewNickname
		};
		
		args.func = function(){
			console.log("func called");
			var arbiter = this;
			var name = jqNewNickname.val();
			var url = jqNewServerURL.val();
			var username = jqNewUsername.val();
			var password = jqNewPassword.val();
			
			//It's a new server so add it to the global servers table
			arbiter.globalDatabase.transaction(function(tx){
			   var insertServerSql = "INSERT INTO servers (name, url, username, password) VALUES (" +
			   arbiter.squote(name) + ", " + arbiter.squote(url) + ", " + arbiter.squote(username) + ", " + arbiter.squote(password) + ");";
			   
			   tx.executeSql(insertServerSql, [], function(tx, res){
					jqNewUsername.removeClass('invalid-field');
					jqNewPassword.removeClass('invalid-field');
							 
					arbiter.currentProject.serverList[name] = {
						url: url,
						username: username,
						password: password,
						serverId: res.insertId,
						layers: {}
					};
					
					//remove the bottom class from the previously last row
					$('.existingServer-bottom-left').removeClass('existingServer-bottom-left');
					$('.existingServer-bottom-right').removeClass('existingServer-bottom-right');
							 
					//if are no existingServer-row elements yet, then this is the top
					var contentClass = 'existingServer-contentColumn';
					var leftClass = 'existingServer-leftColumn';
							 
					if($('.existingServer-row').length == 0){
						contentClass += ' existingServer-top-right';
						leftClass += ' existingServer-top-left';
					}
							 
					contentClass += ' existingServer-bottom-right';
					leftClass += ' existingServer-bottom-left';
							 
							 //var leftPositioning = -1 * (((name.length * 16) / 2) - 40);
							 
					var html = '<div class="existingServer-row">' +
							 		'<div class="existingServer-contentWrapper">' +
							 			'<div class="' + contentClass + '">' +
							 				'<a class="existingServer-name" id="existingServer-' + res.insertId + '" style="font-weight:bold;">' + name + '</a>' +
							 			'</div>' +
							 		'</div>' +
							 		'<div class="' + leftClass + '">' +
							 			'<div class="existingServer-checkbox-container" style="left:8px;top:8px;">' +
							 				'<input type="checkbox" checked class="existingServer-checkbox" server-id="' + res.insertId + '" name="' + name + 
							 					'" id="existingServer-checkbox-' + res.insertId + '" style="width:20px;height:20px;" />' +
							 			'</div>' +
							 		'</div>' +
							 	'</div>';
							 
					jqServersPageContent.append(html);
							 
					jqAddServerButton.removeClass('ui-btn-active');
							 
					window.history.back();
				});
			}, arbiter.errorSql, function(){});
		};
		
		if(this.validateAddServerFields(args)){
			this.authenticateServer(args);
		}
	},
	
	resetAddLayersPage: function() {
		console.log("Reset Add Layers");
		Arbiter.addServersToLayerDropdown();
		Arbiter.disableLayerSelectAndNickname();
	},
	
	resetEditLayersPage: function() {
		console.log("Reset Edit Layers");
		//Arbiter.addServersToLayerDropdown();
		//Arbiter.disableLayerSelectAndNickname();
		
		if(tempLayerToEdit) {
			console.log("Change Layer - " + tempLayerToEdit);
			jqEditLayerSelect.val(tempLayerToEdit).change();
			tempLayerToEdit = null;
		}
		
		if(jqEditLayerSelect.parent().parent().hasClass('ui-select')) {
			console.log("Refresh Layer Select");
			jqEditLayerSelect.selectmenu('refresh', true);
		}
	},
	
	addServersToLayerDropdown: function(_serverName) {
		var arbiter = Arbiter;
		console.log("Testing stuff");
		console.log(arbiter.currentProject.serverList);
		
		//Clear the list
		jqServerSelect.empty();
		jqEditServerSelect.empty();
		
		//Choose your server option
		var option = '<option value="" data-localize="label.chooseAServer">Choose a server...</option>';
			jqServerSelect.append(option);
			jqEditServerSelect.append(option);

		//Add all the servers to the list
		for(var index in arbiter.currentProject.serverList) {
			option = '<option value="' + index + '">' + index + '</option>';
			jqServerSelect.append(option);
			jqEditServerSelect.append(option);
		}
		
		if(_serverName) {
			console.log("Select server");
			jqServerSelect.val(_serverName).change();
			jqEditServerSelect.val(_serverName).change();
		}
		
		if(jqServerSelect.parent().parent().hasClass('ui-select')) {
			jqServerSelect.selectmenu('refresh', true);
		}
		
		if(jqEditServerSelect.parent().parent().hasClass('ui-select')) {
			jqEditServerSelect.selectmenu('refresh', true);
		}
	},
	
	onClick_EditServer: function() {
		//TODO: Add the new server to the server list
		var args = {
			jqusername: jqEditUsername,
			jqpassword: jqEditPassword,
			jqurl: jqEditServerURL,
			jqnickname: jqEditNickname
		};
		
		var arbiter = this;		args.func = function(){
			var username = jqEditUsername.val();
			var password = jqEditPassword.val();
			var name = jqEditNickname.val();
			var url = jqEditServerURL.val();
			var id = jqEditServerButton.attr('server-id');	
		
			arbiter.globalDatabase.transaction(function(tx){
				var updatesql = "UPDATE servers SET name=?, username=?, password=?, url=? WHERE id=?";
				tx.executeSql(updatesql,[name, username, password, url, id], function(tx, res){
							  console.log("server update success");
					jqEditUsername.removeClass('invalid-field');
					jqEditPassword.removeClass('invalid-field');
					
					//get the old name
					var oldname = $('#existingServer-' + id).text();
					
					//TODO: need to check to see if the server is being used
					
					if(arbiter.currentProject.serverList[oldname]){
						//delete the old object
						delete arbiter.currentProject.serverList[oldname];
						
						arbiter.currentProject.serverList[name] = {
							url: url,
							username: username,
							password: password,
							serverId: id,
							layers: {}
						};
					}
					//change the name of the server in the list
					$('#existingServer-' + id).text(name);
					$('#existingServer-checkbox-' + id).attr('name', name);
							  
					jqEditServerButton.removeClass('ui-btn-active');
							  
					window.history.back();
				});
			}, arbiter.errorSql, function(){});
		};
		
		if(this.validateAddServerFields(args)){
			this.authenticateServer(args);
		}
	},
	
	onClick_DeleteServer: function(){
		console.log("onClick_DeleteServer");
		//TODO: check to see if the server is being used
		var arbiter = this;
		var id = jqEditServerButton.attr('server-id');
		
		var deleteServer = function(){
			arbiter.globalDatabase.transaction(function(tx){
				//delete the server
				tx.executeSql("DELETE FROM servers WHERE id=?", [id], function(tx, res){
					//handle after delete - remove server usage info?
					
					//remove from the currentProject object
					var serverName = $('#existingServer-' + id).text();
					delete arbiter.currentProject.serverList[serverName];
					
					//remove from the serverList
					$('#existingServer-' + id).parent().parent().parent().remove();
							  
					//set the existing server list styling just in case the top is being removed
					if(!$('.existingServer-top-left').length){
						var firstChild = jqServersPageContent.children(':first-child');
						if(firstChild.length){
							firstChild.find('.existingServer-contentColumn').addClass('existingServer-top-right');
							firstChild.find('.existingServer-leftColumn').addClass('existingServer-top-left');
						}
					}
					
					//set the existing server list styling just in case the bottom is being removed
					if(!$('.existingServer-bottom-left').length){
						var lastChild = jqServersPageContent.children(':last-child');
						if(lastChild.length){
							lastChild.find('.existingServer-contentColumn').addClass('existingServer-bottom-right');
							lastChild.find('.existingServer-leftColumn').addClass('existingServer-bottom-left');
						}	  
					}
					
					window.history.back();
							  
					$('#deleteServerButton').removeClass('ui-btn-active');
				}, function(tx, err){
					console.log("delete server err: ", err);			  
				});								   
			}, arbiter.errorSql, function(){});
		};
		
		arbiter.globalDatabase.transaction(function(tx){
										   
			tx.executeSql("SELECT * FROM server_usage WHERE server_id=?", [id], function(tx, res){
				var ans;
				if(res.rows.length){
					if(res.rows.length > 1)
						  ans = confirm("The server is being used in " + res.rows.length + " projects! Are you sure you want to delete it?!");
					else
						  ans = confirm("The server is being used in " + res.rows.length + " project! Are you sure you want to delete it?!");
						  
					if(ans){
						//delete the server
						deleteServer.call(arbiter);
					}
				}else{
					ans = confirm("Are you sure you want to delete the server?");
						  
					if(ans){
						//delete the server
						deleteServer.call(arbiter);
					}	  
				}
			}, function(tx, err){
						  console.log("check server_usage err:", err);			  
			});
		}, arbiter.errorSql, function(){});
	},
	
	PopulateLayersList: function() {
		//Fill the servers list (id=idLayersList) with the ones that are available.
		// - Make the div's id = to some number...idk;
		console.log("PopulateLayersList");
		var arbiter = Arbiter;
	
		//TODO: Load layers that are available
		// - add them to the LayersList
		//arbiter.addServersToLayerDropdown();
	},
	
	onClick_EditLayers: function() {
		//TODO: Make the servers List editable
		console.log("User wants to edit his/her layers.");
	},
	
	createMetaTables: function(tx){
		var createServersSql = "CREATE TABLE IF NOT EXISTS servers (id integer primary key, server_id integer not null);";
		
		var createDirtyTableSql = "CREATE TABLE IF NOT EXISTS dirty_table (id integer primary key, f_table_name text not null, fid text not null);";
		
		var createSettingsTableSql = "CREATE TABLE IF NOT EXISTS settings (id integer primary key, aoi_left text not null, " +
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
		
		var insertCurrentProject = function(tx, projectId){
			var serverList = arbiter.currentProject.serverList;
			
			var insertSettingsSql = "INSERT INTO settings (aoi_left, aoi_bottom, aoi_right, aoi_top) VALUES (" + 
			arbiter.squote(arbiter.currentProject.aoi.left) + ", " + arbiter.squote(arbiter.currentProject.aoi.bottom) +
			", " + arbiter.squote(arbiter.currentProject.aoi.right) + ", " + arbiter.squote(arbiter.currentProject.aoi.top) + ");";
			
			tx.executeSql(insertSettingsSql);
			
			for(var x in serverList){
				var _serverId = serverList[x].serverId;
				var insertServerSql = "INSERT INTO servers (server_id) VALUES (" + _serverId +");";
				arbiter.currentProject.variablesDatabase.transaction(function(tx){
					
					console.log(insertServerSql);
					var name = x;
					var serverId = _serverId;
																	 
					tx.executeSql(insertServerSql, [], function(tx, res){
						var insertLayerSql;
						var layer;
						var insertGeometryColumnRowSql;
						var createFeatureTableSql;
						var attributes;	
						
						for(var y in serverList[name].layers){
							layer = serverList[name].layers[y];
								  
							insertLayerSql = "INSERT INTO layers (server_id, layername, f_table_name, featureNS, typeWithPrefix) VALUES (?,?,?,?,?);";
							
							arbiter.currentProject.variablesDatabase.transaction(function(tx){
								tx.executeSql(insertLayerSql, [serverId, y, layer.featureType, layer.featureNS, layer.typeName]);															   
							}, arbiter.errorSql, function(){});
								  
							arbiter.currentProject.dataDatabase.transaction(function(tx){
								insertGeometryColumnRowSql = "INSERT INTO geometry_columns (f_table_name, " +
									"f_geometry_column, geometry_type, srid) VALUES (?,?,?,?)";
																			
								//made fid not unique to be able to handle multiple inserts while offline.
								//fid is null until the server knows about the feature
								attributes = "id integer primary key, fid text, " + layer.geomName + " text not null";
								
								for(var i = 0; i < layer.attributes.length; i++){
									attributes += ", " + layer.attributes[i] + " text";
								}
								
								createFeatureTableSql = "CREATE TABLE IF NOT EXISTS " + layer.featureType +
									" (" + attributes + ");";
									
								
								tx.executeSql(insertGeometryColumnRowSql, [layer.featureType, layer.geomName, layer.geometryType, layer.srsName]);
																	
								var typeName = layer.typeName;
								var geomName = layer.geomName;
								var featureType = layer.featureType;
								var srsName = layer.srsName;
								var url = serverList[name].url;
								var username = serverList[name].username;
								var password = serverList[name].password;
																			
								tx.executeSql(createFeatureTableSql, [], function(tx, res){
									arbiter.pullFeatures(typeName, geomName, featureType, srsName, url, username, password);														  
								});
							}, arbiter.errorSql, function(){});
						}
					});
				}, arbiter.errorSql, function(){});
				
				arbiter.globalDatabase.transaction(function(tx){
					var insertUsageSql = "INSERT INTO server_usage (project_id, server_id) VALUES (" + 
						projectId + ", " + serverList[x].serverId + ");";
					tx.executeSql(insertUsageSql, [], function(tx, res){
						console.log("insert usage successful");
					});	  
				}, arbiter.errorSql, function(){});
			}
			
			// every project has a list of tiles it uses so that:
			// - when the project is removed, the global tile's reference counter can be decremented.
			// - when a project's tiles need to updated, we can potentially used this list... though normally, they will pull data in area of interest. 
			var createTileIdsSql = "CREATE TABLE IF NOT EXISTS tileIds (id integer not null primary key);";  

			tx.executeSql(createTileIdsSql, [], function(tx, res){
				console.log("project tileIds table created");
				
				console.log("starting to cache tiles");
				// cache tiles when new project is created. 
				// TileUtil.startCachingTiles();
				//TODO: try throwing exception and printing e.stack for more infor on error
				// http://www.eriwen.com/javascript/js-stack-trace/
			}, function(tx, err){
				console.log("project tileIds table err: ", err);			  
			});

		};
		
		var writeToDatabases = function(dir){
			
			//Create the databases for that project
			arbiter.currentProject.variablesDatabase = Cordova.openDatabase("Arbiter/Projects/" + arbiter.currentProject.name + "/variables", "1.0", "Variable Database", 1000000);
			arbiter.currentProject.dataDatabase = Cordova.openDatabase("Arbiter/Projects/" + arbiter.currentProject.name + "/data", "1.0", "Data Database", 1000000);
			
			//Create the initial tables in each database
			arbiter.currentProject.variablesDatabase.transaction(arbiter.createMetaTables, arbiter.errorSql, function(){
				arbiter.currentProject.dataDatabase.transaction(arbiter.createDataTables, arbiter.errorSql, function(){
					arbiter.globalDatabase.transaction(function(tx){
						tx.executeSql("INSERT INTO projects (name) VALUES (" + arbiter.squote(arbiter.currentProject.name) + ");", [], function(tx, res){
							//Transaction succeeded so both metadata and data tables exist
								arbiter.currentProject.variablesDatabase.transaction(function(tx){
									insertCurrentProject(tx, res.insertId);													   
								}, arbiter.errorSql, function(){
																					 
								//add to the list of projects on success
							   	var li = "<li><a class='project-list-item'>" + arbiter.currentProject.name + "</a></li>";
							   
							   	arbiter.appendToListView(li, jqProjectsList, function(event){
									arbiter.setCurrentProject($(this).find('a').text(), arbiter);
								});
							   
							   	arbiter.changePage_Pop(div_ProjectsPage);
							});
						});
					}, arbiter.errorSql, function(){});
				});
			});
		};
		
		var error = function(error){
			console.log("error creating directory");
		};
					
		this.fileSystem.root.getDirectory("Arbiter/Projects/" + this.currentProject.name, {create: true, exclusive: false}, writeToDatabases, error);
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
		console.log("Submiting Time! ARBITER SMASH!");
		var valid = this.validateAddLayerSubmit();
		
		console.log(valid);
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
						
					var layerName = selectedOption.html();
					var li = "<li><a onClick='Arbiter.editLayer(\"" + typeName + "\", \"" + layernickname + "\", " + serverInfo.serverId + ")' class='layer-list-item'>" + layernickname + "</a></li>";
													 
					$("ul#layer-list").append(li).listview("refresh");
													 
					jqLayerSubmit.removeClass('ui-btn-active');
					window.history.back();
				}
			});
		}
	},
	
	editLayer: function(_layerName, _layerNickname, _serverID){
		var arbiter = this;
		
		console.log("Layer to edit: " + _layerName + " - " + _serverID);
	
		console.log("Edit Server " + _serverID);
		var serverIndex;
	
		for(var index in arbiter.currentProject.serverList) {
			console.log("Current Server to check:");
			console.log(arbiter.currentProject.serverList[index]);
			if(_serverID == arbiter.currentProject.serverList[index].serverId) {
				serverIndex = index;
				console.log("Server Found! - " + serverIndex);
				break;
			}
		}
		
		console.log("Setting Server to " + serverIndex);
		arbiter.addServersToLayerDropdown(serverIndex);
		tempLayerToEdit = _layerName;
		console.log("Setting Nickname to " + _layerNickname);
		jqEditLayerNickname.val(_layerNickname);
		
		arbiter.changePage_Pop(div_EditLayersPage);
	},
	
	saveLayer: function() {
		console.log("Saving disabled for the time being.");
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
	
	//override: Bool, should override
	pullFeatures: function(featureType, geomName, f_table_name, srs, serverUrl, username, password){
		var arbiter = this;
		var layerNativeSRS = new OpenLayers.Projection(srs);
		var currentBounds = arbiter.currentProject.aoi.clone().transform(WGS84_Google_Mercator, layerNativeSRS);
		
		var postData = '<wfs:GetFeature service="WFS" version="1.0.0" outputFormat="GML2" ' +
		'xmlns:wfs="http://www.opengis.net/wfs" ' +
		'xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml" ' +
		'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs ' +
		'http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd"> ' +
		'<wfs:Query typeName="' + featureType + '">' +
		'<ogc:Filter>' +
		'<ogc:BBOX>' +
		'<ogc:PropertyName>' + geomName + '</ogc:PropertyName>' +
		'<gml:Box srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
		'<gml:coordinates>' + currentBounds.left + ',' + currentBounds.bottom +
		' ' + currentBounds.right + ',' + currentBounds.top + '</gml:coordinates>' +
		'</gml:Box>' +
		'</ogc:BBOX>' +
		'</ogc:Filter>' +
		'</wfs:Query>' +
		'</wfs:GetFeature>';
		
		var encodedCredentials = $.base64.encode(username + ':' + password);
		var request = new OpenLayers.Request.POST({
			url: serverUrl + "/wfs",
			data: postData,
			headers: {
				'Content-Type': 'text/xml;charset=utf-8',
				'Authorization': 'Basic ' + encodedCredentials
			},
			callback: function(response){
				var gmlReader = new OpenLayers.Format.GML({
					extractAttributes: true
				});
				
				var features = gmlReader.read(response.responseText);
				
				arbiter.insertFeaturesIntoTable(features, f_table_name, geomName, srs, false);
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
		
		jqEditLayerSelect.parent().removeClass('ui-disabled').removeAttr('aria-disabled');
		jqEditLayerSelect.removeAttr('aria-disabled disabled').removeClass('mobile-selectmenu-disabled ui-state-disabled');
		
		jqEditLayerNickname.removeAttr('disabled');
	},
	
	disableLayerSelectAndNickname: function(){
		//Clear the list
		jqLayerSelect.empty();
		
		//Choose your server option
		var option = '<option value="" data-localize="label.chooseALayer">Choose a layer...</option>';
		jqLayerSelect.append(option);
		
		jqLayerSelect.parent().addClass('ui-disabled').attr('aria-disabled', 'true');
		jqLayerSelect.attr('disabled', 'disabled').attr('aria-disabled', 'true').addClass('mobile-selectmenu-disabled ui-state-disabled');
		
		jqLayerNickname.val("");
		jqLayerNickname.attr('disabled', 'disabled');
		
		if(jqLayerSelect.parent().parent().hasClass('ui-select')) {
			jqLayerSelect.selectmenu('refresh', true);
		}
	},
	
	getFeatureTypesOnServer: function(serverName){
		
		var arbiter = this;
		var serverInfo = arbiter.currentProject.serverList[serverName];
		var request = new OpenLayers.Request.GET({
			url: serverInfo.url + "/wms?service=wms&version=1.1.1&request=getCapabilities",
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
						
						options +=  '<option layersrs="' + layersrs + '" value="' + 
							layer.name + '">' + layer.title + '</option>';
					}
							
					if(jqLayerSelect.parent().parent().hasClass('ui-select')) {
						jqLayerSelect.html(options).selectmenu('refresh', true);
					}
					
					if(jqEditLayerSelect.parent().parent().hasClass('ui-select')) {
						jqEditLayerSelect.html(options).selectmenu('refresh', true);
					}
					
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
	createFeature: function(obj, srsName){
		var feature = wktFormatter.read(obj.geometry);
		
		// TODO: somehow get the srid from the table instead of assuming it'll be epsg:4326
		feature.geometry.transform(new OpenLayers.Projection(srsName), WGS84_Google_Mercator);
		
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
		
	readLayerFromDb: function(tableName, layerName, geomName, srsName){
		var arbiter = this;
		var layer = map.getLayersByName(layerName + "-wfs")[0];
		console.log("readLayerFromDb: " + tableName + ", " + layerName + ", " + geomName + ", " + srsName);
		arbiter.currentProject.dataDatabase.transaction(function(tx){
			tx.executeSql("SELECT * FROM " + tableName, [], function(tx, res){
				for(var i = 0; i < res.rows.length;i++){
					var row = res.rows.item(i);
						  
					var feature = wktFormatter.read(row[geomName]);
					feature.geometry.transform(new OpenLayers.Projection(srsName), WGS84_Google_Mercator);
					feature.attributes = {};
						  
					for(var x in row){
						if(x != "id" && x != "fid" && x != geomName){
							feature.attributes[x] = row[x];
						}
					}
						  
					if(row.fid)
						feature.fid = row.fid;
					else{
						feature.state = OpenLayers.State.INSERT;
						feature.rowid = row.id;
					}
					
					layer.addFeatures([feature]);
				}
						  
				//after the transaction is complete, check to see which features are dirty
				arbiter.currentProject.variablesDatabase.transaction(function(tx){
					tx.executeSql("SELECT * FROM dirty_table where f_table_name='" + tableName + "';", [], function(tx, res){
						for(var i = 0; i < res.rows.length;i++){
							var feature = layer.getFeatureByFid(res.rows.item(i).fid);
							feature.modified = true;
							feature.state = OpenLayers.State.UPDATE;	  	
						}
					}, function(tx, err){
								  console.log("err: ", err);			  
					});
				}, arbiter.errorSql, function(){});
			});
		}, arbiter.errorSql, function(){
			
		});
	},
	
	/*escape &, <, >, "*/
	encodeChars: function(str){
		if(str){
			str = str.replace(/&/g, "&amp");
			str = str.replace(/</g, "&lt");
			str = str.replace(/>/g, "&gt");
			str = str.replace(/"/g, "&quot");
			str = str.replace(/'/g, "&#39");
		}
		return str;
	},
										
	decodeChars: function(str){
		if(str){
			str = str.replace(/&amp/g, "&");
			str = str.replace(/&lt/g, "<");
			str = str.replace(/&gt/g, ">");
			str = str.replace(/&quot/g, "\"");
			str = str.replace(/&#39/g, "'");
		}
		return str;
	},
						  
	/*
	 * table: the table your querying
	 * feature: the feature being inserted
	 * geomName: name of the geometry
	 * isEdit: if true, transform the geometry to the native srs
	 * srsName: srs for the layer
	 */
	getSql: function(table, feature, geomName, isEdit, srsName){
		var arbiter = this;
		var insertSql = "INSERT INTO " + table;
		var updateSql = "UPDATE " + table + " SET ";
		
		var names = "(";
		var values = "(";
		var params = [];
		
		if(feature.fid){
			names += "fid,";
			values += "?,";
			updateSql += "fid=?,";
			params.push(feature.fid);
		}
		
		var clonedFeature = feature.clone();
		
		if(isEdit)
			clonedFeature.geometry.transform(WGS84_Google_Mercator, new OpenLayers.Projection(srsName));
		var geometry = wktFormatter.write(clonedFeature);
		
		names += geomName + ",";
		values += "?,";
		updateSql += geomName + "=?,";
		params.push(geometry);
		
		for(var x in feature.attributes){
			names += x + ",";
			values += "?,";
			updateSql += x + "=?,";
			params.push(feature.attributes[x]);
		}
		
		names = names.substring(0, names.length - 1) + ")";
		values = values.substring(0, values.length - 1) + ")";
		updateSql = updateSql.substring(0, updateSql.length - 1) + ";";
		
		return {
			insertSql: insertSql + " " + names + " VALUES " + values + ";",
			updateSql: updateSql,
			params: params 
		};
		
	},
											
	insertFeaturesIntoTable: function(features, f_table_name, geomName, srsName, isEdit){
		var arbiter = this;
		var db = arbiter.currentProject.dataDatabase;
		console.log("insertFeaturesIntoTable: ", features);
		console.log("other params: " + f_table_name + geomName + srsName + isEdit);
		for(var i = 0; i < features.length; i++){
			var feature = features[i];
			db.transaction(function(tx){
				var selectSql;
				var selectParams;
				
				var sqlObject = arbiter.getSql(f_table_name, feature, geomName, isEdit, srsName);
						   
				if(feature.fid || feature.rowid){
					if(feature.fid){
						selectSql = "SELECT * FROM " + f_table_name + " WHERE fid=?";
						selectParams = [feature.fid];
					}else{
						selectSql = "SELECT * FROM " + f_table_name + " WHERE id=?";
						selectParams = [feature.rowid];
					}
					
					tx.executeSql(selectSql, selectParams, function(tx, res){
						//console.log(updateList);
						//If this exists, then its an update, else its an insert
						if(res.rows.length){
							console.log("UPDATE", res.rows.item(0));
							db.transaction(function(tx){											 
								//var updateSql = "UPDATE " + f_table_name + updateList + " WHERE id=" + res.rows.item(0).id + ";";
								var updateSql = sqlObject.updateSql.substring(0, sqlObject.updateSql.length - 1) + " WHERE id=?";						
								
								sqlObject.params.push(res.rows.item(0).id);
														
								tx.executeSql(updateSql, sqlObject.params, function(tx, res){
									console.log("update success");			   
								}, function(tx, err){
									console.log("update err: ", err);
								});
								if(feature.fid){						
									arbiter.currentProject.variablesDatabase.transaction(function(tx){
										var insertDirtySql = "INSERT INTO dirty_table (f_table_name, fid) VALUES (?,?);";
																												 
										console.log(insertDirtySql);
										tx.executeSql(insertDirtySql, [f_table_name, feature.fid], function(tx, res){
											console.log("insert dirty success");			 
										}, function(tx, err){
											console.log("insert dirty fail: ", err);
										});
									}, arbiter.errorSql, function(){});
								}
							}, arbiter.errorSql, function(){});
						}else{
							console.log('new insert');
							db.transaction(function(tx){
								tx.executeSql(sqlObject.insertSql, sqlObject.params, function(tx, res){
									console.log("insert success");
									if(isEdit){
										console.log('isEdit: ' + res.insertId);
										if(res.insertId) //hack because insertId is returned as null for the first insert...
											feature.rowid = res.insertId;
										else
											feature.rowid = 1;
									}
								}, function(tx, err){
									console.log("insert err: ", err);
								});
							}, arbiter.errorSql, function(){});
						}
					}, function(tx, err){
						console.log("err: ", err);
					});
				}else{
					console.log('new insert');
					console.log(sqlObject);
					db.transaction(function(tx){
						/*var insertSql = "INSERT INTO " + f_table_name + " (" + propertiesList + ") VALUES (" +
						  propertyValues + ");";
										  
						console.log(insertSql);*/
						console.log(sqlObject);
						tx.executeSql(sqlObject.insertSql, sqlObject.params, function(tx, res){
							console.log("insert success");
							if(isEdit){
								console.log('isEdit: ' + res.insertId);
								if(res.insertId) //hack because insertid is returned as 1 for the first insert...
									feature.rowid = res.insertId;
								else
									feature.rowid = 1;
							}
						}, function(tx, err){
							console.log("insert err: ", err);
						});
					}, arbiter.errorSql, function(){});	
				}
			}, arbiter.errorSql, function(){});
		}
	},
	
	SubmitAttributes: function(){
		if(selectedFeature){
			 
			// Set the attributes of the feature from the form
			for(var x in selectedFeature.attributes){
				selectedFeature.attributes[x] = this.decodeChars($("#textinput-" + x).val());
							  console.log(selectedFeature.attributes[x]);
			}
			
			// If the feature isn't already supposed to be added, the state and modified must be set
			if(!selectedFeature.state){
				selectedFeature.state = OpenLayers.State.UPDATE;
				selectedFeature.modified = true;
			}
			//features, f_table_name, geomName, srsName, isEdit
			var protocol = selectedFeature.layer.protocol;
			this.insertFeaturesIntoTable([selectedFeature], protocol.featureType, protocol.geometryName, protocol.srsName, true);
		}
		
		//$.mobile.changePage("#idMapPage", {transition: "slide", reverse: true});
		$.mobile.changePage("#idMapPage", "pop");
	},
	
	PopulatePopup: function() {
		if(selectedFeature){
			var li = "";
			for(var attr in selectedFeature.attributes){
					li += "<li style='padding:5px; border-radius: 4px;'><div>";
					li += "<label for='textinput" + selectedFeature.attributes[attr] + "'>";
					li += attr;
					li += "</label>";
					li += "<input name='' id='textinput-" + attr + "' placeholder='' value='";
					li += this.encodeChars(selectedFeature.attributes[attr]);
					li += "' type='text'></div></li>";
			}

			$("ul#attribute-list").empty().append(li).listview("refresh");
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
		console.log("meta", meta);
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
			var tableName = meta.featureType;
			
			var saveStrategy = new OpenLayers.Strategy.Save();
			
			var newWFSLayer = new OpenLayers.Layer.Vector(meta.nickname + "-wfs", {
				strategies: [saveStrategy],
				projection: new OpenLayers.Projection(meta.srsName),
				protocol: protocol
			});
			
			// TODO: Get the layer dynamically
			var newWMSLayer = new OpenLayers.Layer.WMS(meta.nickname + "-wms", meta.url + "/wms", {
				layers: meta.typeName,
				transparent: 'TRUE'
			});

			
			map.addLayers([newWMSLayer, newWFSLayer]);
			
			newWFSLayer.events.register("featuremodified", null, function(event){
				arbiter.insertFeaturesIntoTable([event.feature], meta.featureType, meta.geomName, meta.srsName, true);
			});
			
			newWFSLayer.events.register("featureselected", null, function(event){
				console.log("Feature selected: ", event.feature);
				selectedFeature = event.feature;
					
				if(!jqAttributeTab.is(':visible'))
					jqAttributeTab.toggle();
			});
			
			newWFSLayer.events.register("featureunselected", null, function(event){
				console.log("Feature unselected: " + event);
				selectedFeature = null;
				arbiter.CloseAttributesMenu();
					
				if(jqAttributeTab.is(':visible'))
					jqAttributeTab.toggle();
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
				arbiter.currentProject.variablesDatabase.transaction(function(tx){
					tx.executeSql("DELETE FROM dirty_table;");															  
				}, arbiter.errorSql, function(){console.log("delete success");});
				
				var server = arbiter.currentProject.serverList[meta.serverName];
				var serverLayer = server.layers[meta.nickname];
				var url = server.url;
				var username = server.username;
				var password = server.password;
				var typeName = serverLayer.typeName;	
				var geomName = serverLayer.geomName;
				var featureType = serverLayer.featureType;
				var srsName = serverLayer.srsName;
				
				
				arbiter.currentProject.dataDatabase.transaction(function(tx){
					tx.executeSql("DELETE FROM ?", [featureType], function(tx, res){
						//pull everything down
								  console.log("pull after delete");
						console.log("pullFeatures after delete: " + serverLayer.typeName + serverLayer.geomName + serverLayer.featureType + serverLayer.srsName + server.url + server.username + server.password);
						arbiter.pullFeatures(serverLayer.typeName, serverLayer.geomName, serverLayer.featureType, serverLayer.srsName, server.url, server.username, server.password);
					}); 													  
				}, arbiter.errorSql, function(){});
			});
			
			var modifyControl = new OpenLayers.Control.ModifyFeature(newWFSLayer);
			
			var addFeatureControl = new OpenLayers.Control.DrawFeature(newWFSLayer,OpenLayers.Handler.Point);
			addFeatureControl.events.register("featureadded", null, function(event){
				//populate the features attributes object
				var attributes = arbiter.currentProject.serverList[meta.serverName].layers[meta.nickname].attributes;
											  
				for(var i = 0; i < attributes.length;i++){
					event.feature.attributes[attributes[i]] = "";							  
				}
				event.feature.fid = '';
				console.log("new feature", event.feature);
				arbiter.insertFeaturesIntoTable([event.feature], meta.featureType, meta.geomName, meta.srsName, true);	
			});
			
			map.addControl(addFeatureControl);
			
			//TODO: Change the active modify control			
			map.addControl(modifyControl);
			//modifyControl.activate();
						
			arbiter.currentProject.modifyControls[meta.nickname] = {
				modifyControl: modifyControl,
				insertControl: addFeatureControl
			};
			
			var li = "<li><a href='#' class='layer-list-item'>" + meta.nickname + "</a></li>";
			
			try{
				$("ul#layer-list").append(li).listview("refresh");
			}catch(err){
				
			}
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
	
	setSyncColor: function() {
		if(this.isOnline) {
			$('#syncUpdates').css("background-color", "rgba(0, 136, 0, 0.496094)");
		} else {
			$('#syncUpdates').css("background-color", "rgba(136, 0, 0, 0.496094)");
		}
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
		
		this.setSyncColor();
	},
	
	onOffline: function() {
		console.log("Arbiter: Offline");
		if(this.isOnline){
			this.isOnline = false;
		}
		
		this.setSyncColor();
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