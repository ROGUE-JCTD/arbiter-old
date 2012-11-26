
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
var jqCacheTiles;
var jqSyncUpdates;
var jqProjectPageContent;


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

var editorTabOpen = false;

var Arbiter = { 
	
	debugAlertOnError: true,	
	
	fileSystem: null,
	
	globalDatabase: null,
	
	featureIncrement: 0,
	
	layerCount: 0,
	
	//TODO: remove for now until actually supported
	//grout tilesets db. primarily used to import grout tiles into global.tiles table since unlike grout's this table is optimized for access 
	tilesetsDatabase: null, 
	
	currentProject: null,

	isOnline: false,
	
    Initialize: function() {
		console.log("What will you have your Arbiter do?"); // http://www.youtube.com/watch?v=nhcHoUj4GlQ
		
		Cordova.Initialize(Arbiter);
		
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
		jqCacheTiles = $('#cacheTiles');
		jqSyncUpdates	 = $('#syncUpdates');
		jqProjectPageContent = $('#idProjectPageContent');
		jqServersPageContent = $('.ServersPageContent');
		div_ProjectsPage.live('pageshow', Arbiter.PopulateProjectsList);
		div_ServersPage.live('pageshow', Arbiter.PopulateServersList);
		div_LayersPage.live('pageshow', Arbiter.PopulateLayersList);
				
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(filesystem){
			Arbiter.fileSystem = filesystem;
			
			Arbiter.fileSystem.root.getDirectory("Arbiter", {create: true, exclusive: false}, function(dir){
				console.log("created arbiter directory");
				
				Arbiter.fileSystem.root.getDirectory("Arbiter/Projects", {create: true, exclusive: false}, function(dir){
					console.log("created projects directory");
					Arbiter.InitializeProjectList(dir);
				}, function(error){
					console.log("error getting projects");
				});
				
								
				Arbiter.globalDatabase = Cordova.openDatabase("Arbiter/global", "1.0", "Global Database", 1000000);
				Arbiter.globalDatabase.transaction(function(tx){
					
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
												   
					var createServerUsageSql = "CREATE TABLE IF NOT EXISTS server_usage (id integer primary key, server_id integer, project_id integer, " +
												"FOREIGN KEY(server_id) REFERENCES servers(id), FOREIGN KEY(project_id) REFERENCES projects(id));";

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
						
						for(var i = 0; i < jqServersPageContent.length;i++)
							$(jqServersPageContent[i]).html(html);
						
					}, Arbiter.error, function(){});
					
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
					

				}, Arbiter.error, function(){});
				
				
				
				// create the table that will store the tile sets across all
				// projects
				Arbiter.tilesetsDatabase = Cordova.openDatabase("Arbiter/tilesets", "1.0", "Tilesets Database", 1000000);
				Arbiter.tilesetsDatabase.transaction(function(tx){
					var createTileRefCounterSql = "CREATE TABLE IF NOT EXISTS tilesets (tilelevel_table text PRIMARY KEY, title text not null);";
					   
					tx.executeSql(createTileRefCounterSql, [], function(tx, res){
						console.log("tilesetsDatabase.tile_ref_counter table created");
					}, function(tx, err){
						console.log("tilesetsDatabase.tile_ref_counter table err: ", err);
					});
				}, Arbiter.error, function(){});
				
			}, function(error){
				console.log("couldn't create arbiter directory");
			});
			
		}, function(error){
			console.log("requestFileSystem failed with error code: " + error.code);					 
		});
		
		div_AddLayersPage.live('pageshow', Arbiter.resetAddLayersPage);
		div_EditLayersPage.live('pageshow', Arbiter.resetEditLayersPage);
		
		//Start on the Language Select screen if this is the users first time.
		//Otherwise move to the Projects page.
		if(!isFirstTime) {
			UpdateLocale();
			Arbiter.changePage_Pop(div_ProjectsPage);
		}
		
		//Initialize Projections
		WGS84 					= new OpenLayers.Projection('EPSG:4326');
		WGS84_Google_Mercator	= new OpenLayers.Projection('EPSG:900913');
		
		wktFormatter = new OpenLayers.Format.WKT();
		capabilitiesFormatter = new OpenLayers.Format.WMSCapabilities();
		describeFeatureTypeReader = new OpenLayers.Format.WFSDescribeFeatureType();
		
		div_MapPage.live('pageshow', Arbiter.onShowMap);

		div_MapPage.live('pagebeforeshow', Arbiter.onBeforeShowMap);
		
		div_AreaOfInterestPage.live('pageshow', Arbiter.onShowAOIMap);

		div_AddLayersPage.live('pagebeforeshow', function(){
			//populate the servers drop down from the currentProject.serverList
			var html = '<option value="" data-localize="label.chooseAServer">Choose a Server...</option>';
			
			for(var x in Arbiter.currentProject.serverList){
				html += '<option value="' + x + '">' + x + '</option>';
			}
			
			jqServerSelect.html(html);
		});
		
		jqSaveButton.mouseup(function(event){
			map.layers[map.layers.length - 1].strategies[0].save();
		});

		
		div_NewProjectPage.live('pagebeforeshow', function(){
			Arbiter.onBeforeCreateProject();
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
					Arbiter.currentProject.name = newName;
					Arbiter.changePage_Pop(div_ServersPage);
					jqNewProjectName.removeClass('invalid-field');
					jqNewProjectName.attr('placeholder', 'Name your Project *');
					jqToServersButton.removeClass('ui-btn-active');
				}else{
					console.log("file system error: " + error.code);				  
				}
		  	};
			
			if(newName)
				Arbiter.fileSystem.root.getDirectory("Arbiter/Projects/" + jqNewProjectName.val(), null, projectAlreadyExists, projectDoesntExist);
			else{
				jqNewProjectName.addClass('invalid-field');
				jqToServersButton.removeClass('ui-btn-active');
			}
		});
		
		jqServerSelect.change(function(event){
			var serverName = $(this).val();
			if(serverName)
				Arbiter.getFeatureTypesOnServer(serverName);
			else{
				jqLayerSelect.html('<option value="" data-localize="label.chooseALayer">Choose a layer...</option>');
				jqLayerSelect.selectmenu('refresh', true);
				jqLayerNickname.val('');
				Arbiter.disableLayerSelectAndNickname();
			}
		});

		jqEditServerSelect.change(function(event){
			//var serverUrl = $(this).val();
							  console.log($(this).val());
			Arbiter.getFeatureTypesOnServer($(this).val());
		});

		jqLayerSelect.change(function(event){
			//jqLayerNickname.val(jqLayerSelect.find('option:selected').text());
		});
		
		jqEditLayerSelect.change(function(event){
			//jqEditLayerNickname.val(jqEditLayerSelect.find('option:selected').text());
		});
		
		jqAddFeature.mouseup(function(event){
			console.log("Add Feature");
			if(Arbiter.currentProject.activeLayer){
				var addFeatureControl = Arbiter.currentProject.modifyControls[Arbiter.currentProject.activeLayer].insertControl;
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
			
			var ans = true;
			if(Arbiter.currentProject.deletedServers.length){
				var layersWithoutServer = "";
				for(var x in Arbiter.currentProject.deletedServers){
					for(y in Arbiter.currentProject.deletedServers[x].layers){
						layersWithoutServer += y + ", ";
					}
				}
				
				ans = confirm("The following layers are not linked with a server: " + layersWithoutServer.substring(0, layersWithoutServer.length-2) + "\n Do you wish to continue?");
			}
			
			if(ans){
				for ( var i = 0; i < layers.length; i++) {
					if(layers[i].strategies.length)
						layers[i].strategies[0].save();
				}
			}
		});
		
		jqSyncUpdates.taphold(function(){
			// do the same things as mouseup event
			jqSyncUpdates.mouseup();
			
			// but also re-cache tiles
			TileUtil.cacheTiles();
		});
				
		jqEditorTab.mouseup(function(event){
			Arbiter.ToggleEditorMenu();
		});
		
		jqAttributeTab.mouseup(function(event){
			Arbiter.ToggleAttributeMenu();
		});
		
		jqCacheTiles.mouseup(function(event){
			TileUtil.cacheTiles();
		});
		
		$(".layer-list-item").mouseup(function(event){
			Arbiter.populateAddLayerDialog($(this).text());
		});
		
		$(".server-list-item").mouseup(function(event){
			Arbiter.populateAddServerDialog($(this).text());
		});
		
		$(".existingServer-checkbox").live('click', function(event){
			var element = $(this);
			var id = element.attr('server-id');			
			var name = element.attr('name');
										   
			if(element.is(":checked")){ // if checked, add the server to the projects serverList
				Arbiter.globalDatabase.transaction(function(tx){
					tx.executeSql("SELECT * FROM servers WHERE id=?;", [id], function(tx, res){
						if(res.rows.length){
							var row = res.rows.item(0);
								  
							Arbiter.currentProject.serverList[row.name] = {
								layers: {},
								password: row.password,
								url: row.url,
								username: row.username,
								serverId: row.id
							};
						}
					}, function(tx, err){
																 
					});
				}, Arbiter.error, function(){});
			}else{
				delete Arbiter.currentProject.serverList[name];								
			}
		});
		
		$('.project-name').live('mouseup', function(event){
			//alert("project name mouse up");
			if(!$('.project-checkbox').is(':visible'))
				Arbiter.onOpenProject($(this).text());
			else{
				var oldname = $(this).text();
				var editProjectNameInput = '<div data-role="fieldcontain" class="ui-hide-label edit-project-name" style="top:-5px;width:100%;position:absolute;">' +
												'<label for="' + oldname + '-edit-name"></label>' +
												'<input name="' + oldname + '-edit-name" id="' + 
													oldname + '-edit-name" autocomplete="off" autocapitalize="off" placeholder="' + oldname + '"/>' +
											'</div>';
				
				$(this).before('<div class="ui-icon ui-icon-delete" edit-name="' + oldname + '" ' +
							   'onclick="Arbiter.cancelEditProject(true, this);" style="position:absolute;right:5px;top:15px;z-index:20;"></div>');
				$(this).replaceWith(editProjectNameInput);
										 
				$('#idProjectPageContent input').textinput();
				$('#' + oldname + '-edit-name').focus();
			}
		});
		
		$('.existingServer-contentColumn').live('mouseup', function(event){
			var element = $(this);
			var name = element.find('a').text();
												
			Arbiter.globalDatabase.transaction(function(tx){
				tx.executeSql("SELECT * FROM servers WHERE name=?;", [name], function(tx, res){
					if(res.rows.length){
						var row = res.rows.item(0);
							  
						jqEditUsername.val(row.username);
						jqEditPassword.val(row.password);
						jqEditNickname.val(row.name);
						jqEditServerURL.val(row.url);
						jqEditServerButton.attr('server-id', row.id);
					}
					
					Arbiter.changePage_Pop('#idEditServerPage');
				});
			}, Arbiter.error, function(){});
		});
		
		$('.project-checkbox').live('mouseup', function(event){
				console.log("delete");
				
				var ans = confirm("Are you sure you want to delete this project?!");
				
				if(ans){
					var name = $(this).attr('name');
					$('#' + name + '-row').remove();
					Arbiter.setProjectRoundedCorners();
					Arbiter.onDeleteProject(name);
				}
		});
		//this.GetFeatures("SELECT * FROM \"Feature\"");
		console.log("Now go spartan, I shall remain here.");
    },
    
    // called as soon as user begins to create a project
    onBeforeCreateProject: function() {
		console.log("---- onBeforeCreateProject");
    	Arbiter.onCloseCurrentProject();
    	
    	// all clearing of the current project should be done on onCloseCurrentProject
    	// here, we initialize new project
    	Arbiter.currentProject = Arbiter.initializeCurrentProject();
    },
    
    // gets called once we have collected all the information about the new project
	onCreateProject: function() {
		console.log("---- onCreateProject");
		
		Arbiter.currentProject.aoi = aoiMap.getExtent();
		
		var insertCurrentProject = function(tx, projectId){
			var serverList = Arbiter.currentProject.serverList;
			
			var insertSettingsSql = "INSERT INTO settings (aoi_left, aoi_bottom, aoi_right, aoi_top) VALUES (" + 
			Arbiter.squote(Arbiter.currentProject.aoi.left) + ", " + Arbiter.squote(Arbiter.currentProject.aoi.bottom) +
			", " + Arbiter.squote(Arbiter.currentProject.aoi.right) + ", " + Arbiter.squote(Arbiter.currentProject.aoi.top) + ");";
			
			tx.executeSql(insertSettingsSql);
			
			for(var x in serverList){
				var _serverId = serverList[x].serverId;
				var insertServerSql = "INSERT INTO servers (server_id) VALUES (" + _serverId +");";
				Arbiter.currentProject.variablesDatabase.transaction(function(tx){
					
					console.log(insertServerSql);
					var name = x;
					console.log("server name: " + name);
					var serverId = _serverId;
																	 
					tx.executeSql(insertServerSql, [], function(tx, res){
						var insertLayerSql;
						var layer;
						var insertGeometryColumnRowSql;
						var createFeatureTableSql;
						var attributes;	
						
						var layerCount = Arbiter.getAssociativeArraySize(serverList[name].layers);
						Arbiter.layerCount += layerCount;
						
						for(var y in serverList[name].layers){
							layer = serverList[name].layers[y];
							var layername = y;
							
							insertLayerSql = "INSERT INTO layers (server_id, layername, f_table_name, featureNS, typeWithPrefix) VALUES (?,?,?,?,?);";
							
							Arbiter.currentProject.variablesDatabase.transaction(function(tx){
								tx.executeSql(insertLayerSql, [serverId, y, layer.featureType, layer.featureNS, layer.typeName]);															   
							}, Arbiter.error, function(){});
								  
							Arbiter.currentProject.dataDatabase.transaction(function(tx){
								insertGeometryColumnRowSql = "INSERT INTO geometry_columns (f_table_name, " +
									"f_geometry_column, geometry_type, srid) VALUES (?,?,?,?)";
																			
								//made fid not unique to be able to handle multiple inserts while offline.
								//fid is null until the server knows about the feature
								attributes = "id integer primary key, fid text, " + layer.geomName + " text not null";
								
								for(var i = 0; i < layer.attributes.length; i++){
									attributes += ", " + layer.attributes[i] + " " + layer.attributeTypes[i].type;
									if(layer.attributeTypes[i].notnull)
										attributes += " not null";
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
									var projectName = Arbiter.currentProject.name;
									//name = server's name, y = layer's name
									var featureIncrement = 0;
									Arbiter.pullFeatures(typeName, geomName, featureType, srsName, url, username, password, function(featureCount){
										
										featureIncrement++;
										if(featureIncrement >= featureCount){
											console.log("featureIncrement: " + featureIncrement);
											Arbiter.layerCount--;
											if(Arbiter.layerCount == 0){
												console.log("layerCount is 0! yay!");
												Arbiter.onOpenProject(projectName);
											}else{
												console.log("layerCount: " + Arbiter.layerCount);
											}
										}else{
											console.log("featureIncrement: " + featureIncrement);
										}
									});														  
								});
							}, Arbiter.error, function(){});
						}
					});
				}, Arbiter.error, function(){});
				
				Arbiter.globalDatabase.transaction(function(tx){
					var insertUsageSql = "INSERT INTO server_usage (project_id, server_id) VALUES (" + 
						projectId + ", " + serverList[x].serverId + ");";
					tx.executeSql(insertUsageSql, [], function(tx, res){
						console.log("insert usage successful");
					});	  
				}, Arbiter.error, function(){});
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
			Arbiter.currentProject.variablesDatabase = Cordova.openDatabase("Arbiter/Projects/" + Arbiter.currentProject.name + "/variables", "1.0", "Variable Database", 1000000);
			Arbiter.currentProject.dataDatabase = Cordova.openDatabase("Arbiter/Projects/" + Arbiter.currentProject.name + "/data", "1.0", "Data Database", 1000000);
			
			//Create the initial tables in each database
			Arbiter.currentProject.variablesDatabase.transaction(Arbiter.createMetaTables, Arbiter.error, function(){
				Arbiter.currentProject.dataDatabase.transaction(Arbiter.createDataTables, Arbiter.error, function(){
					Arbiter.globalDatabase.transaction(function(tx){
						tx.executeSql("INSERT INTO projects (name) VALUES (" + Arbiter.squote(Arbiter.currentProject.name) + ");", [], function(tx, res){
							//Transaction succeeded so both metadata and data tables exist
								Arbiter.currentProject.variablesDatabase.transaction(function(tx){
									var projectId = res.insertId;
									insertCurrentProject(tx, projectId);													   
								}, Arbiter.error, function(){
																					 
							 	var leftplaceholder = '<div class="project-checkbox ui-icon ui-icon-minus" name="' + Arbiter.currentProject.name +
							 		'" id="project-checkbox-' + Arbiter.currentProject.name + '" style="margin-left:2px;margin-top:3px;"></div>';
									
								Arbiter.appendToListView("project", res.insertId, Arbiter.currentProject.name, leftplaceholder);
							   
							   	Arbiter.changePage_Pop(div_ProjectsPage);
							});
						});
					}, Arbiter.error, function(){});
				});
			});
		};
		
		var error = function(error){
			console.log("error creating directory");
		};
					
		Arbiter.fileSystem.root.getDirectory("Arbiter/Projects/" + Arbiter.currentProject.name, {create: true, exclusive: false}, writeToDatabases, error);
	},
	
    onDeleteProject: function(projectName){
    	console.log("---- onDeleteProject: " + projectName);
    	
		// if the project being deleted is currently open, close it first
    	if (Arbiter.currentProject && Arbiter.currentProject.name === projectName){
    		Arbiter.onCloseCurrentProject();
    	}

		var variablesDatabase = Cordova.openDatabase("Arbiter/Projects/" + projectName + "/variables", "1.0", "Variable Database", 1000000);
		
		// clear tiles related to this db, then perform otehr operations
		TileUtil.clearCache("osm", op, variablesDatabase);
		
		var op = function(){
			//get the projects directory
			Arbiter.fileSystem.root.getDirectory("Arbiter/Projects/" + projectName, {create: false, exclusive: false}, function(dir){
				dir.removeRecursively(function(){
					console.log(projectName + " project deleted");
					Arbiter.globalDatabase.transaction(function(tx){
						tx.executeSql("SELECT id FROM projects WHERE name=?;", [projectName], function(tx, res){
							if(res.rows.length){
								var projectId = res.rows.item(0).id;
								Arbiter.globalDatabase.transaction(function(tx){
									tx.executeSql("DELETE FROM server_usage WHERE project_id=?", [projectId],
								  function(tx, res){
									console.log("deletion success: " + projectId);
								  }, function(tx, err){
												  console.log("deletion failure: " + projectId);
								  });
																   
									tx.executeSql("DELETE FROM projects WHERE id=?", [projectId],
										function(tx, res){
											console.log("deletion success: " + projectId);
										}, function(tx, err){
											console.log("deletion failure: " + projectId);
										});
								}, Arbiter.error, function(){});
							}
						}, function(tx, err){
									  
						});
					}, Arbiter.error, function(){});
				}, function(){
					console.log(projectName + " project deletion failed");					  
				});									 
			});
		}
	},
    
    onOpenProject: function(projectName){
		console.log("---- onOpenProject: " + projectName + ".");

		if (projectName == null || projectName === ""){
    		alert("onOpenProject projectName not valid: " + projectName)
    	}

		// if a project is currently open, close it first
    	if (Arbiter.currentProject){
    		Arbiter.onCloseCurrentProject();
    	}

		
		Arbiter.currentProject = {};
		Arbiter.currentProject.name = projectName;
		Arbiter.currentProject.serverList = {};
		Arbiter.currentProject.deletedServers = { length: 0 };
		Arbiter.currentProject.modifyControls = {};
		
		// set dataDatabase and variablesDatabase
		Arbiter.currentProject.variablesDatabase = Cordova.openDatabase("Arbiter/Projects/" + Arbiter.currentProject.name + "/variables", "1.0", "Variable Database", 1000000);
		Arbiter.currentProject.dataDatabase = Cordova.openDatabase("Arbiter/Projects/" + Arbiter.currentProject.name + "/data", "1.0", "Data Database", 1000000);
		

		Arbiter.currentProject.variablesDatabase.transaction(function(tx){
			// select servers and add to the project
			tx.executeSql("SELECT * FROM servers;", [], function(tx, res){
				var serverObj;
				for(var i = 0; i < res.rows.length; i++){
					serverObj = res.rows.item(i);
					console.log(serverObj);
					console.log("before setting serverList");
					
					//query the global server table to get the server info
					Arbiter.globalDatabase.transaction(function(tx){
						var serverId = serverObj.server_id;
						tx.executeSql("SELECT * FROM servers WHERE id=?;", [serverId], function(tx, res){
							if(res.rows.length){ //There should be one row that matches
								var serverObj = res.rows.item(0);
								Arbiter.currentProject.serverList[serverObj.name] = {
									layers: {},
									password: serverObj.password,
									url: serverObj.url,
									username: serverObj.username,
									serverId: serverObj.id
								};
							  
							  	//select layers and add to the appropriate server
								//var _serverId = serverObj.id;
								Arbiter.setServerLayers(serverObj.id, serverObj.name);
							}else{
								//server was deleted - so add the layers to the deletedServers list
								Arbiter.currentProject.deletedServers.length++;
								Arbiter.currentProject.deletedServers[serverId] = {
									layers: {}  
								};
								Arbiter.setServerLayers(serverId);
							}
						});
					}, Arbiter.error, function(){});
				}
			});
																		 
			//select area of interest and add to the project
			tx.executeSql("SELECT * FROM settings;", [], function(tx, res){
				//should only be 1 row
				if(res.rows.length){
					var settings = res.rows.item(0);
					Arbiter.currentProject.aoi = new OpenLayers.Bounds(
						settings.aoi_left, settings.aoi_bottom, settings.aoi_right, settings.aoi_top
					);
				}
			});
												
		}, Arbiter.error, function(){});
    },
	
    onCloseCurrentProject: function(){
    	console.log("---- onCloseCurrentProject");
    	Arbiter.currentProject = null;
    	
		// if a project was opened before creating this project, we need to clear out the layers list
		$("ul#layer-list").empty();
		
		jqNewProjectName.val('');
		
		$("ul#editor-layer-list").empty();
		
		Arbiter.CloseAttributesMenu();
		Arbiter.CloseEditorMenu();
		
		// destroy map and everything that goes with it. 
		// when next project is opened, a new one will be created and populated
    	if (map){
    		map.destroy();
    		map = null;
    	}
    	
    	if (aoiMap){
    		aoiMap.destroy();
    		aoiMap = null;
    	}
    },
    
    onBeforeShowMap: function(){
    	console.log("---- onBeforeShowMap");
		// this catches the case where a project is opened after one already has been open and helps
    	// zoom to the new project's aoi before the map shows so that the map doesn't zoom a bit later 
    	// allowing the user to notice it
		if (map && Arbiter.currentProject.aoi) {
			map.zoomToExtent(Arbiter.currentProject.aoi, true);
    	}
		
		
		//TODO: hmm, still delays. might have to refresh...
		$('#projectName').text(Arbiter.currentProject.name);
    },
    
    onShowMap: function(){
    	console.log("---- onShowMap");
    	
    	if (map){
    		Arbiter.error("map should not exist!");
    	}
    	
		osmLayer = new OpenLayers.Layer.OSM('OpenStreetMap', null, {
				transitionEffect : 'resize',
				singleTile : false,
				ratio : 1.3671875,
				isBaseLayer : true,
				visibility : true,
				getURL : TileUtil.getURL
			}			
		);    	
    	
		map = new OpenLayers.Map({
			div: "map",
			projection: WGS84_Google_Mercator,
			displayProjection: WGS84,
			theme: null,
			numZoomLevels: 18,
			layers: [osmLayer],
			controls: [
			new OpenLayers.Control.Attribution(),
			new OpenLayers.Control.TouchNavigation({
				dragPanOptions: {
					enableKinetic: true
				}
			}),
			new OpenLayers.Control.Zoom()
			]
		});
		
		
		// we have a map, lets zoom and center based on the aoi
		if (map && Arbiter.currentProject.aoi) {
			map.zoomToExtent(Arbiter.currentProject.aoi, true);
    	}else{
    		Arbiter.error("cannot zoom to extent. see console. map is " + (map?"not null": "NULL"));
    	}
		
		var serverList = Arbiter.currentProject.serverList;
		var url;
		var username;
		var password;
		var layers;
		var li = "";
		var radioNumber = 1;
			
		
		//add the layers to the map and read the data in from the local database
		radioNumber = Arbiter.readLayers(Arbiter.currentProject.serverList, radioNumber);
		Arbiter.readLayers(Arbiter.currentProject.deletedServers, radioNumber);
		
		$("ul#editor-layer-list").listview("refresh");
		
		$("input[type='radio']").bind( "change", function(event, ui) {
			console.log("Radio Change");
			console.log($("input[type=radio]:checked").attr('id'));
			
			Arbiter.currentProject.modifyControls[Arbiter.currentProject.activeLayer].modifyControl.deactivate();
			Arbiter.currentProject.activeLayer = $("input[type=radio]:checked").attr('id');
			Arbiter.currentProject.modifyControls[Arbiter.currentProject.activeLayer].modifyControl.activate();
		});
		
			
		Arbiter.setSyncColor();			


		// if the TileIds table is empty, cache tiles.
		Arbiter.currentProject.variablesDatabase.transaction(function(tx) {
			var statement = "SELECT * FROM tileIds;";
			tx.executeSql(statement, [], function(tx, res) {
				if (res.rows.length === 0) {
					TileUtil.cacheTiles();
				} else {
					console.log("---->> tile have been cached already. not re-caching");
				}
			}, Arbiter.error);
		}, Arbiter.error, function() {
		});
	},
	
    onShowAOIMap: function(){
    	console.log("---- onShowAOIMap");
    	
    	console.log("---- onShowAreaOfInterestPage");
    	
    	if (aoiMap){
    		Arbiter.error("aoiMap should not exist!");
    	}
    	
		aoi_osmLayer = new OpenLayers.Layer.OSM('OpenStreetMap', null, {
			transitionEffect: 'resize'
		});

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
    },	
	
	ToggleEditorMenu: function() {
		if(!editorTabOpen) {
			Arbiter.OpenEditorMenu();
		} else {
			Arbiter.CloseEditorMenu();
		}
	},
	
	ToggleAttributeMenu: function() {
		if(!attributeTab) {
			Arbiter.OpenAttributesMenu();
		} else {
			Arbiter.CloseAttributesMenu();
			
			if(attributeTab) {
				if(selectedFeature) {
					Arbiter.newWFSLayer.unselected(selectedFeature);
				}
			}
		}
	},

	OpenEditorMenu: function() {
		editorTabOpen = true;
		$("#idEditorMenu").animate({ "left": "72px" }, 50);
		var width;
		
		if(Arbiter.isOrientationPortrait()) {
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
		
		if(Arbiter.isOrientationPortrait()) {
			width = screen.width - 72;
		} else {
			width = screen.height - 72;
		}
		$("#attributeTab").animate({ "right": width }, 50);
		$("#editorTab").animate({ "opacity": "0.0" }, 0);
		
		Arbiter.PopulatePopup();
	},
	
	CloseAttributesMenu: function() {
		attributeTab = false;
		$("#idAttributeMenu").animate({ "left": "100%" }, 50);
		$("#attributeTab").animate({ "right": "0px" }, 50);
		$("#editorTab").animate({ "opacity": "1.0" }, 0);
	},
	
	ShowCachingTilesMenu: function() {
		$("#idCachingTilesMenu").animate({ "left": "0%" }, 50);
		$("#cachingPercentComplete").html("<center>Clearing Cache</center>");
	},
	
	HideCachingTilesMenu: function() {
		$("#idCachingTilesMenu").animate({ "left": "100%" }, 50);
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
		var projectDeleteButtons = $('.project-checkbox');
		
		var editButton = $('#idProjectsPage .ui-btn-right').find('.ui-btn-text');
		//transitions are funny with current layout
		if(!projectDeleteButtons.is(':visible')){
			projectDeleteButtons.css('display', 'block');
			editButton.text('Done');
		}else{
			$('.edit-project-name').each(function(index){
				Arbiter.cancelEditProject(false, $(this).prev());
			});
			
			projectDeleteButtons.css('display', 'none');
			editButton.text('Edit');
		}
	},
	
	setProjectRoundedCorners: function(){
		var rows = jqProjectPageContent.find('.project-row');
		if(!jqProjectPageContent.find('.project-top-left').length && rows.length){
			var firstChild = $(rows[0]);
			if(firstChild.length){
				firstChild.find('.project-contentColumn').addClass('project-top-right');
				firstChild.find('.project-leftColumn').addClass('project-top-left');
			}
		}
		
		//set the existing server list styling just in case the bottom is being removed
		if(!jqProjectPageContent.find('.project-bottom-left').length && rows.length){
			var lastChild = $(rows[rows.length - 1]);
			if(lastChild.length){
				lastChild.find('.project-contentColumn').addClass('project-bottom-right');
				lastChild.find('.project-leftColumn').addClass('project-bottom-left');
			}	  
		}
	},
	
	PopulateServersList: function() {
		//Fill the servers list (id=idServersList) with the ones that are available.
		// - Make the div's id = to ServerID number;
		console.log("PopulateServersList");
		
		//TODO: Load servers that are available
		// - add them to the ServersList
	},
	
	//cancel == true if cancelling
	cancelEditProject: function(cancel, element){
		var oldname = $(element).attr('edit-name');
		var row = $('#' + oldname + '-row');
		var editInput = row.find('.edit-project-name');
		var newName = editInput.find('input').val();
		console.log("cancel edit project: " + oldname);
		editInput.prev().remove();
		if(!cancel && newName){
			//set the text and the id of the "a" element
			var newA = '<a class="project-name" id="project-' + newName + '"><span style="position:absolute;top:10px;left:10px;">' + newName + '</span></a>';
			editInput.replaceWith(newA);
			row.find('.project-checkbox').attr('name', newName).attr('id', 'project-checkbox-' + newName);
			row.attr('id', newName + '-row');
			Arbiter.commitEditProject(oldname, newName);
		}else{
			var oldA = '<a class="project-name" id="project-' + oldname + '"><span style="position:absolute;top:10px;left:10px;">' + oldname + '</span></a>';
			editInput.replaceWith(oldA);
		}
	},
	
	commitEditProject: function(oldName, newName){
		console.log('oldname - ' + oldName + ', newname - ' + newName);
		//get the old directory
		Arbiter.fileSystem.root.getDirectory("Arbiter/Projects/" + oldName, {create: false, exclusive: false}, function(dir){
			//get the parent directory
			dir.getParent(function(parentEntry){
				//move the directory to the new name
				dir.moveTo(parentEntry, newName, function(dir){
					//change the name of the project in the global database
					Arbiter.globalDatabase.transaction(function(tx){
													   console.log("update project name: " + oldName);
						tx.executeSql('UPDATE projects SET name=? WHERE name=?;', [newName, oldName], function(tx, res){
							console.log("update project name success");											 
						});
					}, Arbiter.error, function(){});
				}, function(err){
					console.log("error moving directory:", err);	
				});
			}, function(err){
							console.log("error getting metadata: ", err);										 
			});
		}, function(error){
			console.log("error getting projects");
		});
	},
	
	
	//listname = existingServer or project
	appendToListView: function(listname, id, name, leftplaceholder){
		/*$(_item).appendTo(_listview).mouseup(_mouseup);
		
		if(_listview.hasClass('ui-listview'))
			_listview.listview("refresh");
		
		_listview.children(':first-child').addClass('ui-corner-top');
		_listview.children(':last-child').addClass('ui-corner-bottom');*/
		
		//remove the bottom class from the previously last row
		$('.' + listname + '-bottom-left').removeClass(listname + '-bottom-left');
		$('.' + listname + '-bottom-right').removeClass(listname + '-bottom-right');
		
		//if are no existingServer-row elements yet, then this is the top
		var contentClass = listname + '-contentColumn';
		var leftClass = listname + '-leftColumn';
		
		if($('.' + listname + '-row').length == 0){
			contentClass += ' ' + listname + '-top-right';
			leftClass += ' ' + listname + '-top-left';
		}
		
		contentClass += ' ' + listname + '-bottom-right';
		leftClass += ' ' + listname + '-bottom-left';
		
		if(listname == 'existingServer')
			aElement = '<a class="' + listname + '-name" id="' + listname + '-' + id + '" style="font-weight:bold;">' + name + '</a>';
		else
			aElement = '<a class="' + listname + '-name" id="' + listname + '-' + id + '"><span style="position:absolute;top:10px;left:10px;font-weight:bold;">' + name + '</span></a>';
		//var leftPositioning = -1 * (((name.length * 16) / 2) - 40);
		
		var html = '<div class="' + listname + '-row" id="' + name + '-row">' +
		'<div class="' + listname + '-contentWrapper">' +
		'<div class="' + contentClass + '">' +
		aElement +
		'</div>' +
		'</div>' +
		'<div class="' + leftClass + '">' +
		'<div class="' + listname + '-checkbox-container" style="left:8px;top:8px;">' +
		leftplaceholder +
		'</div>' +
		'</div>' +
		'</div>';
		
		if(listname == 'existingServer'){
			for(var i = 0; i < jqServersPageContent.length;i++)
				$(jqServersPageContent[i]).append(html);
		}else{ //projects
			$('#idProjectPageContent').append(html);
		}
	},
	
	InitializeProjectList: function(dirEntry){
		
		var directoryReader = dirEntry.createReader();
		
		
		var success = function(entries){
			var entry;
			var html = '';
			var contentClass;
			var leftClass;
			var leftplaceholder;
			
			for(var i = 0;i < entries.length;i++){
				entry = entries[i];
				contentClass = 'project-contentColumn';
				leftClass = 'project-leftColumn';
				leftplaceholder = '<div class="project-checkbox ui-icon ui-icon-minus" name="' + entry.name +
					'" id="project-checkbox-' + entry.name + '"></div>';
				
				if(i == 0){
					contentClass += ' project-top-right';
					leftClass += ' project-top-left';
				}
				
				if(i == (entries.length - 1)){
					contentClass += ' project-bottom-right';
					leftClass += ' project-bottom-left';
				}
				
				//leftPositioning = -1 * (((row.name.length * 16) / 2) - 40);
				
				html += '<div class="project-row" id="' + entry.name +'-row">' +
				'<div class="project-contentWrapper">' +
				'<div class="' + contentClass + '">' +
				'<a class="project-name" id="project-' + entry.name + '"><span style="position:absolute;top:10px;left:10px;font-weight:bold;">' + entry.name + '</span></a>' +
				'</div>' +
				'</div>' +
				'<div class="' + leftClass + '">' +
				'<div class="project-checkbox-container">' +
				leftplaceholder +
				'</div>' +
				'</div>' +
				'</div>';
			}
			
			if(html){
				var instructions = '<div data-localize="label.selectProject" style="text-align:center;margin-bottom:15px;font-weight:bold;">Select a project to begin working</div>';
				
				$("#idProjectPageContent").html(instructions + html);
			}
		};
		
		var fail = function(error){
			console.log("Failed to list directory contents: " + error.code);
		};
		
		directoryReader.readEntries(success, fail);
	},
	
	readLayers: function(serverList, radioNumber){
		var li = "";
		var layers;
		console.log("readLayers");
		for(var x in serverList){
			layers = serverList[x].layers;
			for(var y in layers){
				//add the wms and wfs layers to the map
				console.log("add layer");
				Arbiter.AddLayer({
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
				console.log("added layer");
				li += "<li style='padding:5px; border-radius: 4px;'>";
				li += "<input type='radio' name='radio-choice' id='" + y;
				li += "' value='choice-";
				li += radioNumber + "'";
				
				if(radioNumber == 1) {
					li += "checked='checked'/>";
					Arbiter.currentProject.activeLayer = y;
					Arbiter.currentProject.modifyControls[Arbiter.currentProject.activeLayer].modifyControl.activate();
				} else {
				 	li += "/>";
				}
				li += "<label for='radio-choice-" + radioNumber + "'>";
				li += x + " / " + y;
				li += "</label>";
				radioNumber++;
				 
				//add the data from local storage
				Arbiter.readLayerFromDb(layers[y].featureType, y, layers[y].geomName, layers[y].srsName);
			}
		}
		
		$("ul#editor-layer-list").append(li);
		
		return radioNumber;
	},
	
	//deleted is true if the server was deleted
	setServerLayers : function(serverId, serverName) {
		Arbiter.currentProject.variablesDatabase.transaction(function(tx) {
			var serversList;
			
			if(serverName)
				serversList = Arbiter.currentProject.serverList[serverName];
			else
				serversList = Arbiter.currentProject.deletedServers[serverId];
															 
			if(serverName)
				console.log("server: " + serverName + " - " + serverId);
			else
				console.log("deleted server: " + serverId);
			
			console.log("SELECT * FROM layers where server_id=" + serverId);
			tx.executeSql("SELECT * FROM layers where server_id=?", [serverId], function(tx, res) {
				var layer;

				for ( var j = 0; j < res.rows.length; j++) {
					layer = res.rows.item(j);
					serversList.layers[layer.layername] = {
						featureNS : layer.featureNS,
						featureType : layer.f_table_name,
						typeName : layer.typeWithPrefix,
						attributes : [],
						attributeTypes: []
					};

					// get the geometry name, type, and srs of the layer
					Arbiter.currentProject.dataDatabase.transaction(function(tx) {
						var layerObj = layer;
						var geomColumnsSql = "SELECT * FROM geometry_columns where f_table_name='" + layerObj.f_table_name + "';";

						tx.executeSql(geomColumnsSql, [], function(tx, res) {
							var geomName;
							//var server = Arbiter.currentProject.serverList[serverName];
							var serverLayer = serversList.layers[layerObj.layername];

							if (res.rows.length) { // should only be 1 right now
								geomName = res.rows.item(0).f_geometry_column;

								// get the attributes of the layer
								Arbiter.currentProject.dataDatabase.transaction(function(tx) {
									var tableSelectSql = "PRAGMA table_info (" + layerObj.f_table_name + ");";

									serverLayer.geomName = geomName;
									serverLayer.srsName = res.rows.item(0).srid;
									serverLayer.geometryType = res.rows.item(0).geometry_type;

									tx.executeSql(tableSelectSql, [], function(tx, res) {
										var attr;
										for ( var h = 0; h < res.rows.length; h++) {
											attr = res.rows.item(h);

											if (attr.name != 'fid' && attr.name != geomName && attr.name != 'id'){
												serverLayer.attributes.push(attr.name);
												serverLayer.attributeTypes.push({
													type: attr.type,
													notnull: attr.notnull
												});
											}
										}
									});
								}, Arbiter.error, function() {});
							}
						});
					}, Arbiter.error, function() {});
				}

				Arbiter.changePage_Pop(div_MapPage);
			});

		}, Arbiter.error, function() {});
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
		}else if(Arbiter.currentProject.serverList[nickname]){ //TODO: need to check the global db now
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
			args.func.call(Arbiter);	
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
		var username = args.jqusername.val();
		var password = args.jqpassword.val();
		var url = args.jqurl.val();
		
		$.post(url + "/j_spring_security_check", {username: username, password: password}, function(results, textStatus, jqXHR){
			Arbiter.checkCacheControl(jqXHR.getResponseHeader("cache-control"), args);
		}).error(function(err){ //seems to require request to the server before it actually can find it
			$.post(url + "/j_spring_security_check", {username: username, password: password}, function(results, textStatus, jqXHR){
				Arbiter.checkCacheControl(jqXHR.getResponseHeader("cache-control"), args);
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
			var name = jqNewNickname.val();
			var url = jqNewServerURL.val();
			var username = jqNewUsername.val();
			var password = jqNewPassword.val();
			
			//It's a new server so add it to the global servers table
			Arbiter.globalDatabase.transaction(function(tx){
			   var insertServerSql = "INSERT INTO servers (name, url, username, password) VALUES (" +
			   Arbiter.squote(name) + ", " + Arbiter.squote(url) + ", " + Arbiter.squote(username) + ", " + Arbiter.squote(password) + ");";
			   
			   tx.executeSql(insertServerSql, [], function(tx, res){
					jqNewUsername.removeClass('invalid-field');
					jqNewPassword.removeClass('invalid-field');
							 
					Arbiter.currentProject.serverList[name] = {
						url: url,
						username: username,
						password: password,
						serverId: res.insertId,
						layers: {}
					};
				   
				   var leftplaceholder = '<input type="checkbox" checked class="existingServer-checkbox" server-id="' + res.insertId + '" name="' + name + 
				   		'" id="existingServer-checkbox-' + res.insertId + '" style="width:20px;height:20px;" />';
						
				   Arbiter.appendToListView('existingServer', res.insertId, name, leftplaceholder);
				
				   jqAddServerButton.removeClass('ui-btn-active');
							 
				   window.history.back();
				});
			}, Arbiter.error, function(){});
		};
		
		if(Arbiter.validateAddServerFields(args)){
			Arbiter.authenticateServer(args);
		}
	},
	
	resetAddLayersPage: function() {
		//alert("resetAddLayersPage");
		console.log("Reset Add Layers");
		Arbiter.addServersToLayerDropdown();
		Arbiter.disableLayerSelectAndNickname();
	},
	
	resetEditLayersPage: function() {
		//alert("resetEditLayersPage");
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
		console.log("Testing stuff");
		console.log(Arbiter.currentProject.serverList);
		
		//Clear the list
		jqServerSelect.empty();
		jqEditServerSelect.empty();
		
		//Choose your server option
		var option = '<option value="" data-localize="label.chooseAServer">Choose a server...</option>';
			jqServerSelect.append(option);
			jqEditServerSelect.append(option);

		//Add all the servers to the list
		for(var index in Arbiter.currentProject.serverList) {
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
		
		args.func = function(){
			var username = jqEditUsername.val();
			var password = jqEditPassword.val();
			var name = jqEditNickname.val();
			var url = jqEditServerURL.val();
			var id = jqEditServerButton.attr('server-id');	
		
			Arbiter.globalDatabase.transaction(function(tx){
				var updatesql = "UPDATE servers SET name=?, username=?, password=?, url=? WHERE id=?";
				tx.executeSql(updatesql,[name, username, password, url, id], function(tx, res){
							  console.log("server update success");
					jqEditUsername.removeClass('invalid-field');
					jqEditPassword.removeClass('invalid-field');
					
					//get the old name
					var oldname = $('#existingServer-' + id).text();
					
					//TODO: need to check to see if the server is being used
					
					if(Arbiter.currentProject.serverList[oldname]){
						//delete the old object
						delete Arbiter.currentProject.serverList[oldname];
						
						Arbiter.currentProject.serverList[name] = {
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
			}, Arbiter.error, function(){});
		};
		
		if(Arbiter.validateAddServerFields(args)){
			Arbiter.authenticateServer(args);
		}
	},
	
	onClick_DeleteServer: function(){
		console.log("onClick_DeleteServer");
		//TODO: check to see if the server is being used
		var id = jqEditServerButton.attr('server-id');
		
		var deleteServer = function(){
			Arbiter.globalDatabase.transaction(function(tx){
				//delete the server
				tx.executeSql("DELETE FROM servers WHERE id=?", [id], function(tx, res){
					//handle after delete - remove server usage info?
					var existingServerButton;
					
					//remove from the currentProject object
					for(var i = 0; i < jqServersPageContent.length;i++){
						existingServerButton = $(jqServersPageContent[i]).find('#existingServer-' + id);
						var serverName = existingServerButton.text();
						if(Arbiter.currentProject.serverList[serverName])
							delete Arbiter.currentProject.serverList[serverName];
						
						//remove from the serverList
						existingServerButton.parent().parent().parent().remove();
								  
						//set the existing server list styling just in case the top is being removed
						if(!$(jqServersPageContent[i]).find('.existingServer-top-left').length){
							var firstChild = $(jqServersPageContent[i]).children(':first-child');
							if(firstChild.length){
								firstChild.find('.existingServer-contentColumn').addClass('existingServer-top-right');
								firstChild.find('.existingServer-leftColumn').addClass('existingServer-top-left');
							}
						}
						
						//set the existing server list styling just in case the bottom is being removed
						if(!$(jqServersPageContent[i]).find('.existingServer-bottom-left').length){
							var lastChild = $(jqServersPageContent[i]).children(':last-child');
							if(lastChild.length){
								lastChild.find('.existingServer-contentColumn').addClass('existingServer-bottom-right');
								lastChild.find('.existingServer-leftColumn').addClass('existingServer-bottom-left');
							}	  
						}
					}
					window.history.back();
							  
					$('#deleteServerButton').removeClass('ui-btn-active');
				}, function(tx, err){
					console.log("delete server err: ", err);			  
				});								   
			}, Arbiter.error, function(){});
		};
		
		Arbiter.globalDatabase.transaction(function(tx){
										   
			tx.executeSql("SELECT * FROM server_usage WHERE server_id=?", [id], function(tx, res){
				var ans;
				if(res.rows.length){
					if(res.rows.length > 1)
						  ans = confirm("The server is being used in " + res.rows.length + " projects! Are you sure you want to delete it?!");
					else
						  ans = confirm("The server is being used in " + res.rows.length + " project! Are you sure you want to delete it?!");
						  
					if(ans){
						//delete the server
						deleteServer.call(Arbiter);
					}
				}else{
					ans = confirm("Are you sure you want to delete the server?");
						  
					if(ans){
						//delete the server
						deleteServer.call(Arbiter);
					}	  
				}
			}, function(tx, err){
						  console.log("check server_usage err:", err);			  
			});
		}, Arbiter.error, function(){});
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
	
	getProjectDirectory: function(_projectName, _successCallback, _errorCallback) {
		Arbiter.fileSystem.root.getDirectory(_projectName, null, _successCallback, _errorCallback);
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
		var valid = Arbiter.validateAddLayerSubmit();
		
		console.log(valid);
		if(valid){
			var serverInfo = Arbiter.currentProject.serverList[jqServerSelect.val()];
			var typeName = jqLayerSelect.val();
			
			var request = new OpenLayers.Request.GET({
				url: serverInfo.url + "/wfs?service=wfs&version=1.1.0&request=DescribeFeatureType&typeName=" + typeName,
				callback: function(response){
					var obj = describeFeatureTypeReader.read(response.responseText);
										 
					var layerattributes = [];
					var attributeTypes = [];
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
						}else if(property.type.indexOf("xsd:") >= 0){
							layerattributes.push(property.name);
							
							//types don't actually matter that much for storing in sqlite, but
							//we need them persistent so we can check manually
							attributeTypes.push({
								type: property.type.substr(4),
								notnull: !property.nillable
							});
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
						attributes: layerattributes,
						attributeTypes: attributeTypes
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
		console.log("Layer to edit: " + _layerName + " - " + _serverID);
	
		console.log("Edit Server " + _serverID);
		var serverIndex;
	
		for(var index in Arbiter.currentProject.serverList) {
			console.log("Current Server to check:");
			console.log(Arbiter.currentProject.serverList[index]);
			if(_serverID == Arbiter.currentProject.serverList[index].serverId) {
				serverIndex = index;
				console.log("Server Found! - " + serverIndex);
				break;
			}
		}
		
		console.log("Setting Server to " + serverIndex);
		Arbiter.addServersToLayerDropdown(serverIndex);
		tempLayerToEdit = _layerName;
		console.log("Setting Nickname to " + _layerNickname);
		jqEditLayerNickname.val(_layerNickname);
		
		Arbiter.changePage_Pop(div_EditLayersPage);
	},
	
	saveLayer: function() {
		console.log("Saving disabled for the time being.");
	},
	
	populateAddServerDialog: function(serverName){
		if(serverName){
			jqNewNickname.val(serverName);
			jqNewServerURL.val(Arbiter.currentProject.serverList[serverName].url);
			jqNewUsername.val(Arbiter.currentProject.serverList[serverName].username);
			jqNewPassword.val(Arbiter.currentProject.serverList[serverName].password);
		}else{
			jqNewNickname.val("");
			jqNewServerURL.val("");
			jqNewUsername.val("");
			jqNewPassword.val("");
			
			jqGoToAddServer.removeClass('ui-btn-active');
		}
		
		Arbiter.changePage_Pop(jqAddServerPage);
	},
	
	//override: Bool, should override
	pullFeatures: function(featureType, geomName, f_table_name, srs, serverUrl, username, password, addProjectCallback, layernickname){
		console.log("pullFeatures: " + featureType + "," + geomName + "," + f_table_name + "," + srs + "," + serverUrl + "," + username + "," + password);
		var layerNativeSRS = new OpenLayers.Projection(srs);
		console.log("aoi: " + Arbiter.currentProject.aoi);
		var currentBounds = Arbiter.currentProject.aoi.clone().transform(WGS84_Google_Mercator, layerNativeSRS);
		
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
				console.log("pull request complete");
				var gmlReader = new OpenLayers.Format.GML({
					extractAttributes: true
				});
				
				var features = gmlReader.read(response.responseText);
				
				//var vectorLayer = map.getLayersByName(layerName + '-wfs')[0];
					
				//vectorLayer.destroyFeatures();
												  
				Arbiter.currentProject.dataDatabase.transaction(function(tx){
																console.log("pragma transaction table name: " + f_table_name);
					tx.executeSql("PRAGMA table_info (" + f_table_name + ");", [], function(tx, res){
						var dtAttributes = [];
						var i;
						var value;
						
						//get the columns that are type dateTime
						console.log("number of columns: " + res.rows.length);
						for(i = 0; i < res.rows.length;i++){
							if(res.rows.item(i).type == "dateTime")
								dtAttributes.push(res.rows.item(i).name);
						}
						
						//GeoServer doesn't include the 'Z' when storing the dateTime, so add it manually
						console.log("dtAttributes: ", dtAttributes);
						for(i = 0; i < features.length;i++){
							for(var j = 0; j < dtAttributes.length;j++){
								value = features[i].attributes[dtAttributes[j]];
								console.log("dt value: " + value);
								if(value && value.substr(value.length - 1) != 'Z')
									features[i].attributes[dtAttributes[j]] += 'Z';
							}
						}
						
						console.log("pullFeatures: ", features);
						Arbiter.insertFeaturesIntoTable(features, f_table_name, geomName, srs, false, addProjectCallback, layernickname);
					});
				}, Arbiter.error, function(){});
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
		console.log('getFeaturetypesOnServer');
		var serverInfo = Arbiter.currentProject.serverList[serverName];
		var request = new OpenLayers.Request.GET({
			url: serverInfo.url + "/wms?service=wms&version=1.1.1&request=getCapabilities",
			user: serverInfo.username,
			password: serverInfo.password,
			callback: function(response){
				console.log('getFeaturetypesOnServer success');
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
					
					Arbiter.enableLayerSelectAndNickname();
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
		Arbiter.UpdateLocale();
		Arbiter.changePage_Pop(div_ProjectsPage);
	},
	
	UpdateLocale: function() {
		$("[data-localize]").localize("locale/Arbiter", { language: CurrentLanguage.locale });
	},
	
	error: function(err){
		console.log('Error: ' + err);
		var trace = Arbiter.getStackTrace();
		
		console.log("StackTrace: \n" + trace);
		
		if (Arbiter.debugAlertOnError) {
			alert("error: " + err + "\n" + trace);
		}		
	},
	
	getStackTrace: function() {
		var callstack = [];
			
		if (typeof resolveFunctionNamesFrom === 'undefined') {
			//TODO: add other objects that we can use to resolve member function
			resolveFunctionNamesFrom = new Array(Arbiter,TileUtil);
		}			
	
		var currentFunction = arguments.callee.caller;
		while (currentFunction) {
			var fn = currentFunction.toString();
			var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('')) || 'anonymous';
			var resolvedName = null;
			
			// if the function is anon, look through our objects to see if it is a member function
			if (fname === "function") {				
				if (currentFunction.name !== ""){
					fname = currentFunction.name;
				} else {
					for(var obj in resolveFunctionNamesFrom){
						var table = resolveFunctionNamesFrom[obj];
						for(var member in table){
							if (table[member] == currentFunction) {
								resolvedName = member;
								break;
							}
						}
						
						if (resolvedName){
							fname = resolvedName;
							break;
						}
					}
				}
			}
			
			callstack.push(fname);
			currentFunction = currentFunction.caller;
		}

		return callstack.join('\n');
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
				lists.values += ', ' + Arbiter.squote(object[x]);
				
			}else{
				lists.propertiesWithType += x + ' TEXT';
				lists.properties += x;
				lists.values += Arbiter.squote(object[x]);
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
		var layer = map.getLayersByName(layerName + "-wfs")[0];
		console.log("readLayerFromDb: " + tableName + ", " + layerName + ", " + geomName + ", " + srsName);
		Arbiter.currentProject.dataDatabase.transaction(function(tx){
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
				Arbiter.currentProject.variablesDatabase.transaction(function(tx){
					tx.executeSql("SELECT * FROM dirty_table where f_table_name='" + tableName + "';", [], function(tx, res){
						for(var i = 0; i < res.rows.length;i++){
							var feature = layer.getFeatureByFid(res.rows.item(i).fid);
							feature.modified = true;
							feature.state = OpenLayers.State.UPDATE;	  	
						}
					}, function(tx, err){
								  console.log("err: ", err);			  
					});
				}, Arbiter.error, function(){});
			});
		}, Arbiter.error, function(){
			
		});
	},
	
	/*escape &, <, >, "*/
	encodeChars: function(str){
		if(str && (toString.call(str) == '[object String]')){
			str = str.replace(/&/g, "&amp");
			str = str.replace(/</g, "&lt");
			str = str.replace(/>/g, "&gt");
			str = str.replace(/"/g, "&quot");
			str = str.replace(/'/g, "&#39");
		}
		return str;
	},
										
	decodeChars: function(str){
		if(str && (toString.call(str) == '[object String]')){
			str = str.replace(/&amp/g, "&");
			str = str.replace(/&lt/g, "<");
			str = str.replace(/&gt/g, ">");
			str = str.replace(/&quot/g, "\"");
			str = str.replace(/&#39/g, "'");
		}
		return str;
	},
	
	initializeCurrentProject: function(){
		return  {
			name: "default",
			aoi: null,
			variablesDatabase: null,
			dataDatabase: null,
			serverList: {},
			deletedServers: {}
		};
	},
						  
	/*
	 * table: the table your querying
	 * feature: the feature being inserted
	 * geomName: name of the geometry
	 * isEdit: if true, transform the geometry to the native srs
	 * srsName: srs for the layer
	 */
	getSql: function(table, feature, geomName, isEdit, srsName){
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
	
	// quick hack to get the proper scope for insertFeaturesIntoTable when syncing...
	tableInsertion: function(f_table_name, feature, geomName, isEdit, srsName, addProjectCallback, layername){
		var db = Arbiter.currentProject.dataDatabase;
		db.transaction(function(tx){
			var selectSql;
			var selectParams;
			
			var sqlObject = Arbiter.getSql(f_table_name, feature, geomName, isEdit, srsName);
				
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
							var updateSql = sqlObject.updateSql.substring(0, sqlObject.updateSql.length - 1) + " WHERE id=?";						
									   console.log("update sql: " + updateSql, sqlObject);
							sqlObject.params.push(res.rows.item(0).id);
													
							tx.executeSql(updateSql, sqlObject.params, function(tx, res){
								console.log("update success");
								$("#saveAttributesSucceeded").fadeIn(1000, function(){
									$(this).fadeOut(3000);
								});
										  
							  	if(feature.fid){						
							  		Arbiter.currentProject.variablesDatabase.transaction(function(tx){
										var insertDirtySql = "INSERT INTO dirty_table (f_table_name, fid) VALUES (?,?);";
																				   
										console.log(insertDirtySql);
										tx.executeSql(insertDirtySql, [f_table_name, feature.fid], function(tx, res){
											console.log("insert dirty success");			 
										}, function(tx, err){
											console.log("insert dirty fail: ", err);
										});
									}, Arbiter.error, function(){});
							  	}
							}, function(tx, err){
								console.log("update err: ", err);
								$("#saveAttributesFailed").fadeIn(1000, function(){
									$(this).fadeOut(3000);
								});
							});
						}, Arbiter.error, function(){});
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
								}else{ // from sync
									console.log("syncing: " + layername + ", ", map);
									if(layername && map){
										var vectorLayer = map.getLayersByName(layername + '-wfs');
										if(vectorLayer.length){
										  	console.log("insert sync:", feature);
										    console.log("srs: " + srsName, feature);
											feature.geometry.transform(new OpenLayers.Projection(srsName), WGS84_Google_Mercator);
											vectorLayer[0].addFeatures([feature]);
										  	console.log("insert sync end:", feature);
										}
									}
								}
								
								if(addProjectCallback)
									addProjectCallback.call(Arbiter, features.length);
							}, function(tx, err){
								console.log("insert err: ", err);
							});
						}, Arbiter.error, function(){});
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
				}, Arbiter.error, function(){});	
			}
		}, Arbiter.error, function(){});
	},
	
	insertFeaturesIntoTable: function(features, f_table_name, geomName, srsName, isEdit, addProjectCallback, layername){
		console.log("insertFeaturesIntoTable: ", features);
		console.log("other params: " + f_table_name + geomName + srsName + isEdit);
		
		if(addProjectCallback && !features.length)
			addProjectCallback.call(Arbiter, features.length);
		
		for(var i = 0; i < features.length; i++){
			var feature = features[i];
			Arbiter.tableInsertion(f_table_name, feature, geomName, isEdit, srsName, addProjectCallback, layername);
		}
	},
	
	validateAttributes: function(feature){
		var valid = true;
		var inputs = $("ul#attribute-list input");
		var attributeTypes = feature.layer.attributeTypes;
		inputs.each(function(){
			var attribute = $(this).parent().text();
			var value = $(this).val();
			console.log(attribute + ": " + value);
			var type = attributeTypes[attribute].type;
			var attrValid = true;
			if(attributeTypes[attribute].notnull && !value){
				valid = false;
				$(this).addClass('invalid-field');
				attrValid = false;
			}else{
				if((type == "int") || (type == "float") || (type == "double") || (type == "long")){
					if(isNaN(value)){
						valid = false;
						attrValid = false;
						$(this).addClass('invalid-field');
						$(this).val('');
					}
				}else if(type == "boolean"){
					value = value.toLowerCase();
					if((value != 0) && (value != 1) && (value != "true") && (value != "false")){
						valid = false;
						attrValid = false;
						$(this).addClass('invalid-field');
						$(this).val('');
					}
				}
				//these are being handled by using html5 date,time, and datetime inputs	
				/*else if(type == "date"){
					
				}else if(type == "time"){
					
				}else if(type =="dateTime"){
					
				}*/
			}
					
			if(attrValid)
				$(this).removeClass('invalid-field');
		});
		
		return true;
	},
	
	countCharInString: function(str, char){
		return str;					  
	},
							  
	SubmitAttributes: function(){
		if(selectedFeature){
			//features, f_table_name, geomName, srsName, isEdit
			var valid = Arbiter.validateAttributes(selectedFeature);
							  
			if(valid){
				console.log(selectedFeature);
				var value;
				// Set the attributes of the feature from the form
				//this needs to be done before the call to insertFeaturesIntoTable because
				//insertFeaturesIntoTable uses the feature.attributes for getting the values
				for(var x in selectedFeature.attributes){
					value = $("#textinput-" + x).val();
					if(selectedFeature.layer.attributeTypes[x].type == "time"){ 
					   	console.log(value);
						//if seconds aren't there, add them
					   	if(value.replace(/[^:]/g, "").length < 2)
							value += ":00";
					}
					selectedFeature.attributes[x] = Arbiter.decodeChars(value);
				}
							  
				// If the feature isn't already supposed to be added, the state and modified must be set
				if(!selectedFeature.state){
					selectedFeature.state = OpenLayers.State.UPDATE;
					selectedFeature.modified = true;
				}
				var protocol = selectedFeature.layer.protocol;
				Arbiter.insertFeaturesIntoTable([selectedFeature], protocol.featureType, protocol.geometryName, protocol.srsName, true);
			}else{
				$("#saveAttributesFailed").fadeIn(1000, function(){
					$(this).fadeOut(3000);
				});		  
			}
		}
		
		//$.mobile.changePage("#idMapPage", {transition: "slide", reverse: true});
		Arbiter.changePage_Pop('#idMapPage');
	},
	
	getInputType: function(type){
		console.log("getInputType: " + type);
		var obj = {};
		
		if((type == "int") || (type == "long")){
			obj.type = 'number';
			obj.placeholder = 'ex. 4';
		}else if((type == "float") || (type == "double")){
			obj.type = 'number';
			obj.placeholder = 'ex. 4.0';
		}else if(type == "date"){
			obj.type = 'date';
			obj.placeholder = 'ex. 2012-11-01';
		}else if(type == "time"){
			obj.type = 'time';
			obj.placeholder = 'ex. 08:15';
		}else if(type == "dateTime"){
			obj.type = 'datetime';
			obj.placeholder = 'ex. 2012-11-01 08:15 AM';
		}else if(type == "boolean"){
			obj.type = 'text';
			obj.placeholder = 'ex. true';
		}else{
			obj.type = 'text';
			obj.placeholder = 'ex. hello';
		}
		
		return obj;
	},
	
	PopulatePopup: function() {
		if(selectedFeature){
			var li = "";
			var type= '';
							  
			for(var attr in selectedFeature.attributes){
					type = Arbiter.getInputType(selectedFeature.layer.attributeTypes[attr].type);
					li += "<li style='padding:5px; border-radius: 4px;'><div>";
					li += "<label for='textinput-" + attr + "'>";
					li += attr;
					li += "</label>";
					li += "<input name='' id='textinput-" + attr + "' placeholder='" + type.placeholder + "' value='";
					li += Arbiter.encodeChars(selectedFeature.attributes[attr]);
					li += "' type='" + type.type + "'></div></li>";
			}
			
			$("ul#attribute-list").empty().append(li).listview("refresh");
			$("#attributeMenuContent").append('<div id="saveAttributesSucceeded" style="display:none;">' +
											  	'<span style="color:green;font-size:24px;">&#x2713;</span>' +
												'<span style="color:green;">Save Succeeded</span>' +
											  '</div>' +
											'<div id="saveAttributesFailed" style="display:none;">' +
											  	'<span style="color:red;font-size:24px;">&#x2716;</span>' +
												'<span style="color:red;">Save Failed</span>' +
											'</div>');
		}
	},
	
	//db filename, table in db file, featureType, featureNS, geomName, srsName, geoserverURL, nickname
	StoreLayerMetadata: function(db, metadata){
		var query = function(tx){
			tx.executeSql("CREATE TABLE IF NOT EXISTS " + metadataTable + " (id integer primary key, file text not null, featuretable text not null," +
				" featuretype text not null, featurens text not null, geomname text not null, srsname text not null, geoserverurl text not null," +
				" nickname text not null);");
			
			tx.executeSql("INSERT INTO " + metadataTable + " (file, featuretable, featuretype, featurens, geomname, srsname, geoserverurl, nickname) VALUES ('" +
				metadata.file + "', '" + metadata.table + "', '" + metadata.featureType + "', '" + metadata.featureNS + "', '" +
				metadata.geomName + "', '" + metadata.srsName + "', '" + metadata.geoserverURL + "', '" + metadata.nickname + "');");
		};
		
		db.transaction(query, Arbiter.error, function(){});
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
	AddLayer : function(meta) {
		console.log("meta", meta);
		var protocol = null;
		var newLayers = [];
		var strategies = [];
		var server;
		
		if(meta.username)
			server = Arbiter.currentProject.serverList[meta.serverName];
		else
			server = Arbiter.currentProject.deletedServers[meta.serverName];
		
		var serverLayer = server.layers[meta.nickname];
		
		if (meta.username) {
			var encodedCredentials = $.base64.encode(meta.username + ':' + meta.password);

			protocol = new OpenLayers.Protocol.WFS({
				version : "1.0.0",
				url : meta.url + "/wfs",
				featureNS : meta.featureNS,
				geometryName : meta.geomName,
				featureType : meta.featureType,
				srsName : meta.srsName,
				headers : {
					Authorization : 'Basic ' + encodedCredentials
				}
			});
			
			strategies.push(new OpenLayers.Strategy.Save());
			
			var newWMSLayer = new OpenLayers.Layer.WMS(meta.nickname + "-wms", meta.url + "/wms", {
				layers : meta.typeName,
				transparent : 'TRUE'
			});
			
			newLayers.push(newWMSLayer);
			
			strategies[0].events.register("success", '', function(event) {

				console.log("save success: ", event);
				// Update the wmsLayer with the save
				newWMSLayer.mergeNewParams({
					'ver' : Math.random()
				// override browser caching
				});

				newWMSLayer.redraw(true);

				// map.layers[2].destroyFeatures();
				// Arbiter.pullFeatures(true);
				// Remove the features for this layer from the table keeping
				// track
				// of dirty features
				Arbiter.currentProject.variablesDatabase.transaction(function(tx) {
					tx.executeSql("DELETE FROM dirty_table;");
				}, Arbiter.error, function() {
					console.log("delete success");
				});

				var url = server.url;
				var username = server.username;
				var password = server.password;
				var typeName = serverLayer.typeName;
				var geomName = serverLayer.geomName;
				var featureType = serverLayer.featureType;
				var srsName = serverLayer.srsName;

				Arbiter.currentProject.dataDatabase.transaction(function(tx) {
					tx.executeSql("DELETE FROM " + featureType, [], function(tx, res) {
						// pull everything down
								  
						newWFSLayer.destroyFeatures();
						console.log("pull after delete");
						console.log("pullFeatures after delete: " + serverLayer.typeName + serverLayer.geomName + serverLayer.featureType + serverLayer.srsName
								+ server.url + server.username + server.password);
						Arbiter.pullFeatures(serverLayer.typeName, serverLayer.geomName, serverLayer.featureType, serverLayer.srsName, server.url,
								server.username, server.password, null, meta.nickname);
						}, function(tx, err){
							console.log("save delete failure:", err);	  
						});
				}, Arbiter.error, function() {});
			});
		}
		
		var tableName = meta.featureType;

		var newWFSLayer = new OpenLayers.Layer.Vector(meta.nickname + "-wfs", {
			strategies : strategies,
			projection : new OpenLayers.Projection(meta.srsName),
			protocol : protocol
		});		

		newWFSLayer.attributeTypes = {};
		
		for(var i = 0; i < serverLayer.attributes.length;i++)
			newWFSLayer.attributeTypes[serverLayer.attributes[i]] = serverLayer.attributeTypes[i];
		
		newLayers.push(newWFSLayer);
		
		map.addLayers(newLayers);

		newWFSLayer.events.register("featuremodified", null, function(event) {
			Arbiter.insertFeaturesIntoTable([ event.feature ], meta.featureType, meta.geomName, meta.srsName, true);
		});

		newWFSLayer.events.register("featureselected", null, function(event) {
			console.log("Feature selected: ", event.feature);
			selectedFeature = event.feature;

			if (!jqAttributeTab.is(':visible'))
				jqAttributeTab.toggle();
		});

		newWFSLayer.events.register("featureunselected", null, function(event) {
			console.log("Feature unselected: " + event);
			selectedFeature = null;
			Arbiter.CloseAttributesMenu();

			if (jqAttributeTab.is(':visible'))
				jqAttributeTab.toggle();
		});
		
		var modifyControl = new OpenLayers.Control.ModifyFeature(newWFSLayer);

		var addFeatureControl = new OpenLayers.Control.DrawFeature(newWFSLayer, OpenLayers.Handler.Point);
		addFeatureControl.events.register("featureadded", null, function(event) {
			// populate the features attributes object
			var attributes = Arbiter.currentProject.serverList[meta.serverName].layers[meta.nickname].attributes;

			for ( var i = 0; i < attributes.length; i++) {
				event.feature.attributes[attributes[i]] = "";
			}
			event.feature.fid = '';
			console.log("new feature", event.feature);
			Arbiter.insertFeaturesIntoTable([ event.feature ], meta.featureType, meta.geomName, meta.srsName, true);
		});

		map.addControl(addFeatureControl);

		// TODO: Change the active modify control
		map.addControl(modifyControl);
		// modifyControl.activate();

		Arbiter.currentProject.modifyControls[meta.nickname] = {
			modifyControl : modifyControl,
			insertControl : addFeatureControl
		};

		var li = "<li><a href='#' class='layer-list-item'>" + meta.nickname + "</a></li>";

		try {
			$("ul#layer-list").append(li).listview("refresh");
		} catch (err) {

		}
	},
	
	// Get the current bounds of the map for GET requests.
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
		if(Arbiter.getOrientation() == 90 || Arbiter.getOrientation() == -90)
			return true;
		else
			return false;
	},
	
	/*
	 Returns true if the application is in Portrait mode.
	 */
	isOrientationPortrait: function() {
		if(Arbiter.getOrientation() == 0 || Arbiter.getOrientation() == 180)
			return true;
		else
			return false;
	},
	
	setSyncColor: function() {
		if(Arbiter.isOnline) {
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
		if(!Arbiter.isOnline){
			Arbiter.isOnline = true;
		}
		
		Arbiter.setSyncColor();
	},
	
	onOffline: function() {
		console.log("Arbiter: Offline");
		if(Arbiter.isOnline){
			Arbiter.isOnline = false;
		}
		
		Arbiter.setSyncColor();
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