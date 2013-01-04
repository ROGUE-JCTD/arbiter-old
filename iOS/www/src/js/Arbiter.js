
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
var aoiStyleMap;

var layerColors = ['aqua', 'yellow', 'teal', 'purple', 'fuchsia', 'lime', 'maroon', 'black', 'navy', 'olive', 'grey', 'red', 'green', 'silver', 'white' ];

/* ============================ *
 * 			  Layer
 * ============================ */
var baseLayer;

var wmsSelectControl;
var wktFormatter;
var capabilitiesFormatter;
var describeFeatureTypeReader;

var metadataTable = "layermeta";
var modifiedTable = "dirtytable";

var selectControl;
var selectedFeature;
var oldSelectedFID;

/*
 *	jQuery Elements
 */
var div_MapPage;

var div_WelcomePage;
var div_ProjectsPage;
var div_NewProjectPage;
var div_ServersPage;
var div_LayersPage;
var div_AddLayerPage;			//TODO: rename to LayerPage
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
var jqBaseLayerSelect;
var jqLayerSelect;
var jqLayerNickname;
var jqLayerSubmit;
var jqProjectsList;
var jqEditorTab;
var jqAttributeTab;
var jqExistingServers;
var jqAddFeature;
var jqSyncUpdates;
var jqProjectPageContent;
var jqGoToAOI;
var jqFindMeButton;
var jqAOIFindMeButton;
var jqDeleteFeatureButton;

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

var awayFromMap = false;
var editorTabOpen = false;

var Arbiter = { 
	
	debugAlertOnError: true,
	
	debugAlertOnWarning: false,
	
	debugCallstack: false,	
	
	fileSystem: null,
	
	globalDatabase: null,
	
	layerCount: 0,
	
	//can probably reuse layerCount, but just to be safe
	deleteLayerCount: 0,
	
	//TODO: remove for now until actually supported
	//grout tilesets db. primarily used to import grout tiles into global.tiles table since unlike grout's this table is optimized for access 
	tilesetsDatabase: null, 
	
	currentProject: null,

	isOnline: false,
	
	layersSettingsList: null,
	
	serversList: null,
	
	//if this isn't null, then the save callback will call at the end
//	tempDeleteLayerFromProject: null,
	
	//keep track of how many features are left, so we'll know when
	//to call tempDeleteLayerFromProject
	//tempDeleteCountFeatures: 0,
	
	//object with the server and layername 
	deletingLayersInfo: null,
	
	radioNumber: 1,

    Initialize: function() {
		console.log("What will you have your Arbiter do?"); // http://www.youtube.com/watch?v=nhcHoUj4GlQ
		
		//sqlitePlugin.DEBUG = true;
		
		Cordova.Initialize(Arbiter);

		//HACK: online event doesn't fire in Cordova 2.2.0
		// - work around to see if we are online
		if(Cordova.checkConnection()){Arbiter.onOnline();} else { Arbiter.onOffline();}
		setInterval(function(){if(Cordova.checkConnection()){Arbiter.onOnline();} else { Arbiter.onOffline();}}, 30000);
		
		//Save divs for later
		div_MapPage 		= $('#idMapPage');
		div_WelcomePage		= $('#idWelcomePage');
		div_ProjectsPage	= $('#idProjectsPage');
		div_NewProjectPage	= $('#idNewProjectPage');
		div_ServersPage		= $('#idServersPage');
		div_LayersPage		= $('#idLayersPage');
		div_AddLayerPage	= $('#idAddLayerPage');
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
		jqExistingServers = $('#existingServers');
		jqBaseLayerSelect = $('#baselayerselect');
		jqLayerSelect = $('#layerselect');
		jqLayerNickname = $('#layernickname');
		jqLayerSubmit = $('#addLayerSubmit');
		jqProjectsList = $('ul#idProjectsList');
		jqEditorTab = $('#editorTab');
		jqAttributeTab = $('#attributeTab');
		jqAddFeature	 = $('#addPointFeature');
		jqDeleteFeatureButton = $('#deleteFeatureButton');
		jqGoToAOI = $('#goToAreaOfInterest');
		jqFindMeButton = $('#map #findMeButton');
		jqAOIFindMeButton = $('#aoiMap #findMeButton');
		jqSyncUpdates	 = $('#syncUpdates');
		jqProjectPageContent = $('#idProjectPageContent');
		jqServersPageContent = $('.ServersPageContent');
		
		
		div_ProjectsPage.live('pageshow', Arbiter.PopulateProjectsList);
		div_ServersPage.live('pagebeforeshow', Arbiter.PopulateServersList);
		div_ArbiterSettingsPage.live('pagebeforeshow', Arbiter.renameBackButtons);

		//Acquire the file system

		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(filesystem){
			Arbiter.fileSystem = filesystem;
			console.log("window.requestFileSystem: Arbiter.fileSystem acquired");
			
			//Open/Create Arbiter directory.
			Arbiter.fileSystem.root.getDirectory("Arbiter", {create: true}, function(dir){
				console.log("Arbiter.fileSystem: 'Arbiter' directory created/exists.");
				
				//Open/Create global.db
				Arbiter.globalDatabase = Cordova.openDatabase("Arbiter/global", "1.0", "Global Database", 1000000);
				
					//Create settings table
					Cordova.transaction(Arbiter.globalDatabase, "CREATE TABLE IF NOT EXISTS settings (id integer primary key, language text not null);", [], function(tx, res){
						console.log("global.db: 'settings' table created.");
							
							//Create server_usage table
							Cordova.transaction(Arbiter.globalDatabase, "CREATE TABLE IF NOT EXISTS projects (id integer primary key, name text not null);",
								[], function(tx, res){
								console.log("global.db: 'projects' table created.");	
								
								//Create projects table
								Cordova.transaction(Arbiter.globalDatabase, "CREATE TABLE IF NOT EXISTS server_usage (id integer primary key, server_id integer, project_id integer, " +
									"FOREIGN KEY(server_id) REFERENCES servers(id), FOREIGN KEY(project_id) REFERENCES projects(id));",
									[], function(tx, res){
									console.log("global.db: 'server_usage' table created.");
									
									//Create tiles table
									var createTilesSql = "CREATE TABLE IF NOT EXISTS tiles (" +
										"id integer primary key autoincrement, " +
										"tileset text not null, " +
										"z integer not null, " +
										"x integer not null, " +
										"y integer not null, " +
										"path text not null, " +
										"url text not null, " +
										"ref_counter integer not null);";
										
										//Create servers table
										Cordova.transaction(Arbiter.globalDatabase, "CREATE TABLE IF NOT EXISTS servers (id integer primary key autoincrement, name text not null, " +
											"url text not null, username text not null, password text not null);", [], function(tx, res){
											console.log("global.db: 'servers' table created.");	
											
											//Populate the existing server dropdown
											Cordova.transaction(Arbiter.globalDatabase, "SELECT * FROM servers;", [], function(tx, res){
												//Create the list for servers
												Arbiter.serversList = new ListWidget({
													div_id: "idServersList",
													before_delete: function(itemInfo, deleteRow){
														console.log("before_delete - itemInfo: ", itemInfo);
														
														var ans = confirm('Are you sure you want to remove "' + itemInfo.servername + '" from the project?');
														
														if(ans){
															Arbiter.deletingLayersInfo = {
																servername: itemInfo.servername,
																layername: null
															};
															
															Arbiter.deleteLayerCount = Arbiter.getAssociativeArraySize(Arbiter.currentProject.serverList[itemInfo.servername].layers);
															
															jqSyncUpdates.click();
														}
													},
													edit_button_id: "idEditServersButton",
													checkbox: true,
													checkbox_checked: function(itemInfo){
														console.log("checkbox_checked", itemInfo);
														Cordova.transaction(Arbiter.globalDatabase, "SELECT * FROM servers WHERE id=?;", [itemInfo.serverid], function(tx, res){
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
														});
													},
													checkbox_unchecked: function(itemInfo){
														console.log("checkbox_unchecked: ", itemInfo);
														delete Arbiter.currentProject.serverList[itemInfo.servername];
													},
													onContentClicked: function(itemInfo){ //TODO : FIX THIS SHIAT
														console.log("server list content clicked!", itemInfo);
																							
															Cordova.transaction(Arbiter.globalDatabase, "SELECT * FROM servers WHERE name=?;", [itemInfo.servername], function(tx, res){
																if(res.rows.length){
																	var row = res.rows.item(0);
																		  
																	jqEditUsername.val(row.username);
																	jqEditPassword.val(row.password);
																	jqEditNickname.val(row.name);
																	jqEditServerURL.val(row.url);
																	jqEditServerButton.attr('server-id', row.id).attr('server-name', row.name);
																}
																Arbiter.changePage_Pop('#idEditServerPage');		  
															}, Arbiter.error);
													}
												});
																
												console.log("SELECT * FROM servers and add them to the list!");
										
											}, Arbiter.error);
							
									Cordova.transaction(Arbiter.globalDatabase, createTilesSql, [], function(tx, res){
										console.log("global.db: 'tiles' table created.");	
																	 
									}, function(e) {
										console.log("global.db: 'tiles' table failed to create. - " + e);
									});
																	 
								}, function(e) {
									console.log("global.db: 'projects' table failed to create. - " + e);
								});
																	 
							}, function(e) {
								console.log("global.db: 'server_usage' table failed to create. - " + e);
							});
																	 
						}, function(e) {
							console.log("global.db: 'servers' table failed to create. - " + e);
						});
						
					}, function(e) {
						console.log("global.db: 'settings' table failed to create. - " + e);
					});
				
			}, function(error){
				console.log("Arbiter.fileSystem: Couldn't create 'Arbiter' directory.");
			});
			
			//Open/Create Arbiter/Projects directory.
			Arbiter.fileSystem.root.getDirectory("Arbiter/Projects", {create: true}, function(dir){
				console.log("Arbiter.fileSystem: 'Arbiter/Projects' directory created/exists.");
				Arbiter.InitializeProjectList(dir);
			}, function(error){
				console.log("Arbiter.fileSystem: Couldn't create 'Arbiter/Projects' directory.");
			});	
			
		}, function(error){
			console.log("window.requestFileSystem: Failed with error code: " + error.code);					 
		});
		
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
		
		
		//Create styles
		aoiStyleMap = new OpenLayers.StyleMap({
			'default': new OpenLayers.Style({
		    		fill: false,
		    		strokeColor: 'red',
		    		strokeWidth: 5
		    	}) 
		});
		
		// make point radius larger so it is easier to select point features
		OpenLayers.Feature.Vector.style.default.pointRadius = 12;
		OpenLayers.Feature.Vector.style.select.pointRadius = 12;
		OpenLayers.Feature.Vector.style.temporary.pointRadius = 12;		
		
		
		
		div_MapPage.live('pageshow', Arbiter.onShowMap);

		div_MapPage.live('pagebeforeshow', Arbiter.onBeforeShowMap);
		
		div_AreaOfInterestPage.live('pageshow', Arbiter.onShowAOIMap);
		div_AreaOfInterestPage.live('pagehide', Arbiter.onHideAOIMap);

		
		Arbiter.layersSettingsList = new ListWidget({
			div_id: "idLayerSettingsList", 
			before_delete: function(itemInfo, deleteRow){
				console.log("before_delete - itemInfo: ", itemInfo);
				
				var ans = confirm('Are you sure you want to remove "' + itemInfo.layername + '" from the project?');
				
				if(ans){
					Arbiter.deletingLayersInfo = {
						servername: itemInfo.servername,
						layername: itemInfo.layername
					};
					
				//	Arbiter.deleteLayerCount = Arbiter.getAssociativeArraySize(Arbiter.currentProject.serverList[itemInfo.servername].layers);
					Arbiter.deleteLayerCount = 1;
					/*Arbiter.tempDeleteLayerFromProject = function(){
						console.log("tempDeleteLayerFromProject called!");
							Cordova.transaction(Arbiter.currentProject.variablesDatabase, "DELETE FROM layers WHERE layername=?;", [itemInfo.layername], function(tx, res){
								var layer = Arbiter.currentProject.serverList[itemInfo.servername].layers[itemInfo.layername];
								Cordova.transaction(Arbiter.currentProject.dataDatabase, "DELETE FROM geometry_columns WHERE f_table_name=?", [layer.featureType], function(tx, res){
									Cordova.transaction(Arbiter.currentProject.dataDatabase, "DROP TABLE " + layer.featureType, [], function(tx, res){
										console.log("before_delete: success!", itemInfo);
										
										//TODO: why is destroy not working?
										var wfsLayer = map.getLayersByName(itemInfo.layername + '-wfs');
										
										console.log("before_delete: wfsLayer - ", wfsLayer);
										if(wfsLayer.length){
											map.removeLayer(wfsLayer[0]);
											//wfsLayer[0].destroy();
										}
										
										var wmsLayer = map.getLayersByName(itemInfo.layername + '-wms');
										console.log("before_delete: wmsLayer - ", wmsLayer);
										
										if(wmsLayer.length){
											map.removeLayer(wmsLayer[0]);
											//wmsLayer[0].destroy();
										}
										
										console.log("before remove layer from currentProject obj", itemInfo);
										delete Arbiter.currentProject.serverList[itemInfo.servername].layers[itemInfo.layername];
										
										deleteRow();
										
										if(Arbiter.currentProject.activeLayer == itemInfo.layername){
											Arbiter.currentProject.activeLayer = null;
										}
										
										/*
										 * Delete the controls for editing the layer
										 /
										var controls = Arbiter.currentProject.modifyControls[itemInfo.layername];
										map.removeControl(controls.modifyControl);
										map.removeControl(controls.insertControl);
										controls.modifyControl.destroy();
										controls.insertControl.destroy();
										delete Arbiter.currentProject.modifyControls[itemInfo.layername];
										
										$('ul#editor-layer-list #' + itemInfo.layername).parent().remove();
										
										Arbiter.tempDeleteLayerFromProject = null;
									})
								});
							}, Arbiter.error);
					};*/
					
					jqSyncUpdates.click();
				}
			},
			edit_button_id: "layersSettingsEditButton",
			onContentClicked: function(itemInfo){
				console.log("layers list content clicked!", itemInfo);
				Arbiter.onAddLayerPage(itemInfo.layernickname, itemInfo.layertypename, itemInfo.servername);
			}
		});
		
		$('#layersSettingsEditButton').live('click', function(){
			/*var locale = $(this).attr('data-localize');
			
			if(locale == "button.edit"){
				$(this).attr('data-localize', 'button.done');
			}else{
				$(this).attr('data-localize', 'button.edit');
			}*/
			
			//Arbiter.UpdateLocale();
			
			var currentText = $(this).find('.ui-btn-text');
			
			if(currentText.text() == "Edit"){
				currentText.text('Done');
			}else{
				currentText.text('Edit');
			}
		});
		
		$('#idLayersPage').live('pageshow', function(){
			if (awayFromMap === true){
				$('#idLayersPage #idPageFooter').show();
				$('#idLayersPage #idPageFooterWizard').hide();
			} else {
				$('#idLayersPage #idPageFooter').hide();
				$('#idLayersPage #idPageFooterWizard').show();
			}
		});		
		
		$('#idLayersPage').live('pagebeforeshow', function(){
			Arbiter.layersSettingsList.clearList();
			var serverList = Arbiter.currentProject.serverList;
			
			/*/////////////////////////////////////
			 * 	Populate the list of layers
			 */////////////////////////////////////
			for(var serverKey in serverList){
				for(var layerKey in serverList[serverKey].layers){
					var layer = serverList[serverKey].layers[layerKey];
					
					if (layer.featureType){					
						Arbiter.layersSettingsList.append(layerKey, {
							"servername": serverKey,
							"layernickname": layerKey, 
							"layertypename": serverList[serverKey].layers[layerKey].typeName
						});
					}
				}
			}
			
			// Populate list of built in base layers and any wms layer
			jqBaseLayerSelect.selectmenu();
			
			//Add all the servers to the list
			for(var serverKey in serverList){
				for(var layerKey in serverList[serverKey].layers){
					
					var layer = serverList[serverKey].layers[layerKey];
					
					if (!layer.featureType){
						var option = '<option value="' + layerKey + '" servername="' + serverKey + '" layernickname="' + layerKey + '">' + layerKey + '</option>';
						jqBaseLayerSelect.append(option);
					}
				}
			}
			
			jqBaseLayerSelect.val("openstreetmap.org");
			jqBaseLayerSelect.change();
			jqBaseLayerSelect.selectmenu('refresh', true);
		});
		
		jqSaveButton.click(function(event){
			map.layers[map.layers.length - 1].strategies[0].save();
		});

		
		div_NewProjectPage.live('pagebeforeshow', function(){
			Arbiter.onBeforeCreateProject();
		});
		
		jqToServersButton.click(function(event){
			event.preventDefault();
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
					jqNewProjectName.removeClass('invalid-field');
					jqNewProjectName.attr('placeholder', 'Name your Project *');
					jqToServersButton.removeClass('ui-btn-active');
					Arbiter.onShowServers();
				}else{
					console.log("file system error: " + error.code);				  
				}
		  	};
			
			if(newName) {
				Arbiter.fileSystem.root.getDirectory("Arbiter/Projects/" + jqNewProjectName.val(), null, projectAlreadyExists, projectDoesntExist);
			}
			else{
				jqNewProjectName.addClass('invalid-field');
				jqToServersButton.removeClass('ui-btn-active');
			}
		});
		
		
		jqServerSelect.change(function(event){
			console.log('jqServerSelect.change');
			var serverName = $(this).val();
			if(serverName){
				Arbiter.addLayersOnServerToLayerDropdown(serverName);
				Arbiter.enableLayerSelectAndNickname();
			}else{
				jqLayerSelect.html('<option value="" data-localize="label.chooseALayer">Choose a layer...</option>');
				jqLayerSelect.selectmenu('refresh', true);
				jqLayerNickname.val('');
				Arbiter.disableLayerSelectAndNickname();
			}
		});

		jqLayerSelect.change(function(event){
			jqLayerNickname.val(jqLayerSelect.find('option:selected').text());
		});

		jqBaseLayerSelect.change(function(event){
			console.log('jqBaseLayerSelect.change');
			
			// save baseLayer info
			var selectedOption = jqBaseLayerSelect.find('option:selected');
			
			console.log("jqBaseLayerSelect selected option: ", selectedOption);
			
			Arbiter.currentProject.baseLayerInfo = { layernickname: selectedOption.attr('layernickname'), servername: selectedOption.attr('servername') };
			console.log("baselayer info: ", Arbiter.currentProject.baseLayerInfo);
		});		

		jqAddFeature.click(function(event){
			console.log("Add Feature");
			if(Arbiter.currentProject.activeLayer){
				var addFeatureControl = Arbiter.currentProject.modifyControls[Arbiter.currentProject.activeLayer].insertControl;
				if(addFeatureControl.active){
					addFeatureControl.deactivate();
					$(this).removeClass("active-color");
				}else{
					addFeatureControl.activate();
					$(this).addClass("active-color");
				}
			}
		});
		
		jqDeleteFeatureButton.click(function(){
			console.log("Delete Feature Button Click");
			
			if(Arbiter.currentProject.activeLayer){
				var ans = confirm("Are you sure you want to delete this feature?");
				
				if(ans){
					var controls = Arbiter.currentProject.modifyControls[Arbiter.currentProject.activeLayer];
					var modifyControl = controls.modifyControl;
					
					var savedSelectedFeature = selectedFeature;
					
					modifyControl.deactivate();
					Arbiter.deleteFeature(savedSelectedFeature);
					modifyControl.activate();
				}
			}
		});
		
		jqGoToAOI.click(function(event){
			map.zoomToExtent(Arbiter.currentProject.aoi);
		});
		
		jqFindMeButton.click(function(event){
			Cordova.getGeolocation(function(position){
				var center = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude).transform(WGS84, WGS84_Google_Mercator);
				console.log("center: ", center);
				
				if(map.getZoom() < 13)
					map.setCenter(center, 13);
				else
					map.setCenter(center);
			}, function(error){
				alert("Location not available... Please check that Location Services are on for Arbiter");
			});
		});
		
		jqAOIFindMeButton.click(function(event){
			Cordova.getGeolocation(function(position){
				var center = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude).transform(WGS84, WGS84_Google_Mercator);
				console.log("aoi center: ", center);
				
				if(aoiMap.getZoom() < 13)
					aoiMap.setCenter(center, 13);
				else
					aoiMap.setCenter(center);
			}, function(error){
				Arbiter.error("Location not available... Please check that Location Services are on for Arbiter");
			});
		});
		
		jqSyncUpdates.click(function(event){
			if(Arbiter.isOnline) {
				console.log("---- jqSyncUpdates.click");
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
						if( layers[i].strategies && 
					    	layers[i].strategies.length &&
					    	layers[i].strategies[0] &&
					    	layers[i].strategies[0].save){
						
							layers[i].strategies[0].save();
						}
					}
				}
			}
		});
		
		jqSyncUpdates.taphold(function(){
			// re-cache tiles and when done, perform normal sync to take care of vector data
			TileUtil.cacheTiles(function(){ jqSyncUpdates.click(); });
		});
				
		jqEditorTab.click(function(event){
			Arbiter.ToggleEditorMenu();
		});
		
		jqAttributeTab.click(function(event){
			Arbiter.ToggleAttributeMenu();
		});
				
		$(".layer-list-item").click(function(event){
			Arbiter.populateAddLayerDialog($(this).text());
		});
		
		$('.project-name').live('click', function(event){
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
		
		$('.project-checkbox').live('click', function(event){
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
    
    insertIntoGeometryColumnTable: function(layer){
    	var insertGeometryColumnRowSql = "INSERT INTO geometry_columns (f_table_name, " +
		"f_geometry_column, geometry_type, srid) VALUES (?,?,?,?)";
    
    	Cordova.transaction(Arbiter.currentProject.dataDatabase, insertGeometryColumnRowSql, [layer.featureType, layer.geomName, layer.geometryType, layer.srsName], 
				function(tx, res){ 
					console.log("INSERT INTO geometry_columns"); 
				}, function(e){ 
					console.log("Failed to INSERT INTO geometry_columns"); 
				}
		);
    },
    
    createFeatureTable: function(serverName, layer, layerName, projectIsOpen){
    	/*BEING USED IN TRANSACTION CALLBACK*/
    	var server = Arbiter.currentProject.serverList[serverName];
    	
    	var attributeSql = "id integer primary key, fid text, " + layer.geomName + " text not null";
		
		for(var i = 0; i < layer.attributes.length; i++){
			attributeSql += ", " + layer.attributes[i] + " " + layer.attributeTypes[i].type;
			if(layer.attributeTypes[i].notnull)
				attributeSql += " not null";
		}
		
		var createFeatureTableSql = "CREATE TABLE IF NOT EXISTS " + layer.featureType +
			" (" + attributeSql + ");";
		
		Cordova.transaction(Arbiter.currentProject.dataDatabase, createFeatureTableSql, [], function(tx, res) {
			console.log("createFeatureTable success", layer);
			var featureIncrement = 0;
			
			Arbiter.pullFeatures(layer.typeName, layer.geomName, layer.featureType, layer.srsName, server.url, server.username, server.password, function(featureCount){
				console.log("addProjectCallback: " + featureIncrement);
				featureIncrement++;
				if(featureIncrement >= featureCount){
					console.log("featureIncrement: " + featureIncrement);
					Arbiter.layerCount--;
					if(Arbiter.layerCount == 0){
						console.log("layerCount is 0! yay!");
						if(!projectIsOpen){ // should always be false when creating a project
							Arbiter.onOpenProject(Arbiter.currentProject.name);
						}else{
							Arbiter.readLayer(server, layer, serverName, layerName, projectIsOpen);
						}	
					}else{
						console.log("layerCount: " + Arbiter.layerCount);
					 }
				}else{
					console.log("featureIncrement: " + featureIncrement);
				}
			});
		}, function(e){ console.log("createFeatureTableSql error: " + e); });
    },
    
    insertProjectsLayer: function(serverId, serverName, layerName, layer, projectIsOpen){
    	var insertLayerSql = "INSERT INTO layers (server_id, layername, f_table_name, featureNS, typeWithPrefix) VALUES (?,?,?,?,?);";
    	console.log("insertProjectsLayer", layer);
    	Cordova.transaction(Arbiter.currentProject.variablesDatabase, insertLayerSql, 
    			[serverId, layerName, layer.featureType, layer.featureNS, layer.typeName], function(tx, res){
    		console.log("insertProjectsLayer success");
    		Arbiter.insertIntoGeometryColumnTable(layer);
    		Arbiter.createFeatureTable(serverName, layer, layerName, projectIsOpen);
    	}, function(e){ console.log("insertLayerSql error: " + e); });
    },
    
    insertProjectsServer: function(serverId, serverName, success){
    	console.log("insertProjectsServer: " + serverId + ", " + serverName, success);
    	
    	var insertServerSql = "INSERT INTO servers (server_id) VALUES (" + serverId + ");";
    	console.log(insertServerSql);
    	
    	Cordova.transaction(Arbiter.currentProject.variablesDatabase, insertServerSql, [], function(tx, res){
    		success(serverId, serverName);
    	}, Arbiter.error);
    },
    
    insertServerUsage: function(projectId, serverId, success){
    	var insertUsageSql = "INSERT INTO server_usage (project_id, server_id) VALUES (?, ?);";
		
		Cordova.transaction(Arbiter.globalDatabase,insertUsageSql, [projectId, serverId], success);
    },
    
    // gets called once we have collected all the information about the new project
	onCreateProject: function() {
		console.log("---- onCreateProject");

		var insertCurrentProject = function(projectId){
			Arbiter.layerCount = 0;
			Arbiter.currentProject.projectId = projectId;

			Arbiter.saveAreaOfInterest(true);

			alert("pre set baseLayerInfo property");
			Arbiter.setProjectProperty("baseLayerInfo", Arbiter.currentProject.baseLayerInfo);
			alert("post set baseLayerInfo property");
			
			var serverList = Arbiter.currentProject.serverList;		
			for(var x in serverList){
				Arbiter.insertProjectsServer(serverList[x].serverId, x, function(serverId, serverName){
					console.log("insertProjectServer success: " + serverName + ", ", serverList[serverName]);
					var layerList = Arbiter.currentProject.serverList[serverName].layers;
		    		var layerCount = Arbiter.getAssociativeArraySize(layerList);
					Arbiter.layerCount += layerCount;
					
		    		for(var layerKey in layerList){
		    			Arbiter.insertProjectsLayer(serverId, serverName, layerKey, layerList[layerKey], false);
		    		}
		    		
					console.log("~~ CORDOVA TRANSACTION ERROR LINE 822 ~~");
					console.log("ProjectID: " + projectId);
					console.log("ServerID: " + serverId);
		    		Arbiter.insertServerUsage(projectId, serverId, function(tx, res){
						console.log("insert server usage success");
					});
				});
			}
		};
		
		var writeToDatabases = function(dir){
		
			//Set up a transaction for the global database
			console.log("Add project " + Arbiter.squote(Arbiter.currentProject.name) + " to projects table...");
		
			//Add the project name to the projects table in globle.db
			Cordova.transaction(Arbiter.globalDatabase, "INSERT INTO projects (name) VALUES (" + Arbiter.squote(Arbiter.currentProject.name) + ");", [], function(tx, res){
			
				Arbiter.currentProject.variablesDatabase = Cordova.openDatabase("Arbiter/Projects/" + Arbiter.currentProject.name + "/variables", "1.0", "Variable Database", 1000000);
				Arbiter.currentProject.dataDatabase = Cordova.openDatabase("Arbiter/Projects/" + Arbiter.currentProject.name + "/data", "1.0", "Data Database", 1000000);

				Arbiter.createMetaTables();
				Arbiter.createDataTables();
		
				var projectId = res.insertId;
				insertCurrentProject(projectId);
				
				console.log("Project " + projectId + ": " + Arbiter.squote(Arbiter.currentProject.name) + " added to projects table.");
				
				var leftplaceholder = '<div class="project-checkbox ui-icon ui-icon-minus" name="' + Arbiter.currentProject.name +
					'" id="project-checkbox-' + Arbiter.currentProject.name + '" style="margin-left:2px;margin-top:3px;"></div>';
								
				Arbiter.appendToListView("project", res.insertId, Arbiter.currentProject.name, leftplaceholder);		   
				Arbiter.changePage_Pop(div_ProjectsPage);
			
			}, function(e){
				console.log("Project " + Arbiter.squote(Arbiter.currentProject.name) + " NOT added to projects table - " + e);
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

		var vDb = Cordova.openDatabase("Arbiter/Projects/" + projectName + "/variables", "1.0", "Variable Database", 1000000);
		
		var op = function(){
			//get the projects directory
			Arbiter.fileSystem.root.getDirectory("Arbiter/Projects/" + projectName, {create: false, exclusive: false}, function(dir){
				dir.removeRecursively(function(){
					console.log(projectName + " project deleted");

					Cordova.transaction(Arbiter.globalDatabase, "SELECT id FROM projects WHERE name=?;", [projectName], function(tx, res){
						if(res.rows.length){
							var projectId = res.rows.item(0).id;
							
							Cordova.transaction(Arbiter.globalDatabase, "DELETE FROM server_usage WHERE project_id=?", [projectId],
							function(tx, res){
								console.log("deletion success: " + projectId);
							}, function(e){
								console.log("deletion failure: " + projectId);
							});
															   
							Cordova.transaction(Arbiter.globalDatabase, "DELETE FROM projects WHERE id=?", [projectId],
							function(tx, res){
								console.log("deletion success: " + projectId);
							}, function(e){
								console.log("deletion failure: " + projectId);
							});
						}
					});

				}, function(){
					console.log(projectName + " project deletion failed");					  
				});									 
			});
		};
				
		// clear tiles related to this db, then perform otehr operations
		TileUtil.clearCache("osm", op, vDb);
	},
    
	addServersToProject: function(serverObj){
		console.log("addServersToProject: ", serverObj);
		Cordova.transaction(Arbiter.globalDatabase, "SELECT * FROM servers WHERE id=?;", [serverObj.server_id], function(tx, res){
			console.log("Android debug");
			console.log(" - res.rows.length: " + res.rows.length);
			if(res.rows.length && res.rows.length > 0){ //There should be one row that matches
				console.log("Select layers and add to server.");
				var server = res.rows.item(0);
				Arbiter.currentProject.serverList[server.name] = {
					layers: {},
					password: server.password,
					url: server.url,
					username: server.username,
					serverId: server.id
				};
			  
			  	//select layers and add to the appropriate server
				//var _serverId = serverObj.id;
				console.log(server);
				console.log("Name: " + server.name);
				console.log("ID:  " + server.id);
				Arbiter.setServerLayers(server.id, server.name);
			}else{
				//server was deleted - so add the layers to the deletedServers list
				console.log("Server was deleted.");
				Arbiter.currentProject.deletedServers.length++;
				Arbiter.currentProject.deletedServers[serverObj.server_id] = {
					layers: {}  
				};
				Arbiter.setServerLayers(serverObj.server_id);
			}
		});
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
		
		console.log("~~ CORDOVA ERROR LINE 955 ~~");
		console.log("Project Name: " + Arbiter.currentProject.name);
		//get the project id
		Cordova.transaction(Arbiter.globalDatabase, "SELECT * FROM projects WHERE name=?;", [Arbiter.currentProject.name], function(tx, res){
			if(res.rows.length){
				Arbiter.currentProject.projectId = res.rows.item(0).id;
			}else{
				console.log(res.rows.item(0));
			}
		}, Arbiter.error);
		
		// select servers and add to the project
		Cordova.transaction(Arbiter.currentProject.variablesDatabase, "SELECT * FROM servers;", [], function(tx, res){
			var serverObj;
			for(var i = 0; i < res.rows.length; i++){
				serverObj = res.rows.item(i);
				console.log(serverObj);
				console.log("before setting serverList");
				
				//query the global server table to get the server info
				Arbiter.addServersToProject(serverObj);
			}
		});
														 
		//select area of interest and add to the project
		Cordova.transaction(Arbiter.currentProject.variablesDatabase, "SELECT * FROM settings;", [], function(tx, res){
			//should only be 1 row
			if(res.rows.length){
				var settings = res.rows.item(0);
				Arbiter.currentProject.aoi = new OpenLayers.Bounds(
					settings.aoi_left, settings.aoi_bottom, settings.aoi_right, settings.aoi_top
				);
			}
		});
		
		Arbiter.getProjectProperty("baseLayerInfo", function(key, value){
			Arbiter.currentProject.baseLayerInfo = { servername: value.servername, layernickname: value.layernickname};
		}, function(key){
			Arbiter.error("did not find project property baseLayerInfo");
		}, true);

    },
	
    onCloseCurrentProject: function(){
    	console.log("---- onCloseCurrentProject");
    	Arbiter.currentProject = null;
    	
		//---- reset all menus so that when we create anotehr project, we do not carry any setting from the
    	//     current project that is being closed. 
		
		jqNewProjectName.val('');
		
		Arbiter.restExistingServersCheckboxes();

		$("ul#layer-list").empty();
		
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
    	
    	if (awayFromMap === false) {
			// this catches the case where a project is opened after one already has been open and helps
	    	// zoom to the new project's aoi before the map shows so that the map doesn't zoom a bit later 
	    	// allowing the user to notice it
			if (map && Arbiter.currentProject.aoi) {
				map.zoomToExtent(Arbiter.currentProject.aoi, true);
	    	}
			
			//TODO: hmm, still delays. might have to refresh...
			$('#projectName').text(Arbiter.currentProject.name);
    	}
    },
    
    onShowMap: function(){
    	console.log("---- onShowMap");
 
    	if (awayFromMap === true) {
    		console.log("---- onShowMap.awayFromMap");
    		awayFromMap = false;
    		//Node: do not do anything
    	
    	} else {
	    	if (map){
	    		Arbiter.error("map should not exist!");
	    	}
	    	alert("pre create base layer");
	    	baseLayer = Arbiter.createBaseLayer(Arbiter.currentProject.baseLayerInfo.servername, Arbiter.currentProject.baseLayerInfo.layernickname);		
	    	alert("post create base layer");
	    	
			map = new OpenLayers.Map({
				div: "map",
				projection: WGS84_Google_Mercator,
				displayProjection: WGS84,
				theme: null,
				numZoomLevels: 18,
				layers: [baseLayer],
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
			
	    	alert("created map");
			
			// we have a map, lets zoom and center based on the aoi
			if (map && Arbiter.currentProject.aoi) {
				//---- add the aoi layer so that users can see the aoi				
				Arbiter.addAOIToMap();
				
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
			
			//add the layers to the map and read the data in from the local database
			Arbiter.readLayers(Arbiter.currentProject.serverList);
			Arbiter.readLayers(Arbiter.currentProject.deletedServers);
			
			$("ul#editor-layer-list").listview("refresh");
			
			$("input[type='radio']").bind( "change", function(event, ui) {
				console.log("Radio Change");
				console.log($("input[type=radio]:checked").attr('id'));
				
				Arbiter.currentProject.modifyControls[Arbiter.currentProject.activeLayer].modifyControl.deactivate();
				//Arbiter.currentProject.activeLayer = $("input[type=radio]:checked").attr('id');
				Arbiter.currentProject.activeLayer = $("input[type=radio]:checked")[0].getAttribute('id');
				Arbiter.currentProject.modifyControls[Arbiter.currentProject.activeLayer].modifyControl.activate();
			});
			
				
			Arbiter.setSyncColor();
			
			var statement = "SELECT * FROM tileIds;";
			// if the TileIds table is empty, cache tiles.
			Cordova.transaction(Arbiter.currentProject.variablesDatabase, statement, [], function(tx, res) {
				if (res.rows.length === 0){
					TileUtil.cacheTiles();
				} else {
					console.log("---->> tile have been cached already. not re-caching");
				}
			}, function(e){ console.log("Error reading tileIds - " + e); });
    	}
	},
	
    onShowAOIMap: function(){
    	console.log("---- onShowAOIMap");
    	
    	if (aoiMap){
    		Arbiter.error("aoiMap should not exist!");
    	}
    	
    	alert("onShowAOIMap.pre create base layer");
    	aoi_baseLayer = Arbiter.createBaseLayer(Arbiter.currentProject.baseLayerInfo.servername, Arbiter.currentProject.baseLayerInfo.layernickname);		
    	alert("onShowAOIMap.post create base layer");
    	
		aoiMap = new OpenLayers.Map({
			div: "aoiMap",
			projection: new OpenLayers.Projection("EPSG:900913"),
			displayProjection: new OpenLayers.Projection("EPSG:4326"),
			theme: null,
			numZoomLevels: 18,
			layers: [aoi_baseLayer],
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

    	alert("onShowAOIMap.post createaoi map");
		
		if (Arbiter.currentProject && Arbiter.currentProject.aoi) {
			aoiMap.zoomToExtent(Arbiter.currentProject.aoi, true);
		} else {
			//aoiMap.setCenter(new OpenLayers.LonLat(-13676174.875874922, 5211037.111034083),12);
			Cordova.getGeolocation(function(position){
				var center = new OpenLayers.LonLat(position.coords.longitude, 
						position.coords.latitude).transform(WGS84, WGS84_Google_Mercator);
				
				aoiMap.setCenter(center, 12);
			}, function(err){
				aoiMap.zoomToMaxExtent();
			});
		}
    },
    
    onHideAOIMap: function(){
    	console.log("---- onHideAOIMap");
    	
    	Arbiter.addAOIToMap();
    	
    	if (aoiMap){
    		aoiMap.destroy();
    		aoiMap = null;
    	}
    },
    
    renameBackButtons: function(){
    	var mapBtn = $('#idSettingsBackBtn_map');
    	var projBtn = $('#idSettingsBackBtn_proj');
    	
    	mapBtn.removeClass('ui-btn-left');
    	mapBtn.removeClass('ui-btn-right');
    	
    	projBtn.removeClass('ui-btn-left');
    	projBtn.removeClass('ui-btn-right');
    
    	if(awayFromMap == false) {
    		mapBtn.hide();
    		projBtn.addClass('ui-btn-left');
    		projBtn.show();
    	} else {
    		projBtn.hide();
    		mapBtn.addClass('ui-btn-left');
    		mapBtn.show();
    	}
    },
    
    onShowSettings: function(){
    	console.log("---- onShowSettings");
    	//$('#idArbiterSettingsPage .PageFooter').animate({ "left": "0%" }, 0);
    	//$('#idServersPage .SettingsPageFooter').animate({ "left": "0%" }, 0);
    	//$('#idServersPage .CreatePageFooter').animate({ "left": "100%" }, 0);

		$('#idArbiterSettingsPage .PageFooter').show();
		$('#idServersPage .SettingsPageFooter').show();
		$('#idServersPage .CreatePageFooter').hide();
		
    	Arbiter.serversList.checkbox = false;
    	awayFromMap = true;
    	
    	Arbiter.changePage_Pop(div_ArbiterSettingsPage);
    },
	
    onShowArbiterSettings: function(){
    	console.log("---- onShowArbiterSettings");
    	//$('#idArbiterSettingsPage .PageFooter').animate({ "left": "100%" }, 0);
		$('#idArbiterSettingsPage .PageFooter').hide();
		
		Arbiter.changePage_Pop(div_ArbiterSettingsPage);
    },
    
    onShowServers: function(){
    	console.log("---- onShowServers");
    	Arbiter.serversList.checkbox = true;
    	//$('#idServersPage .SettingsPageFooter').animate({ "left": "100%" }, 0);
    	//$('#idServersPage .CreatePageFooter').animate({ "left": "0%"}, 0);
		
		$('#idServersPage .SettingsPageFooter').hide();
		$('#idServersPage .CreatePageFooter').show();
		
		Arbiter.changePage_Pop(div_ServersPage);
    },
    
    onBackFromSettings: function(){
    	console.log("---- onBackFromSettings. awayFromMap: ", awayFromMap);
    	var currentPage = $.mobile.activePage.attr("id");
    	
    	if (awayFromMap === true){
			Arbiter.changePage_Pop(div_MapPage);
    	} else {
    		Arbiter.changePage_Pop(div_ProjectsPage);
    	}
    },
	
    onBackFromServers: function(){
    	console.log('------- onBackFromServers ---------');
    	
    	if(awayFromMap === true){
    		Arbiter.changePage_Pop(div_MapPage);
    	}else{ //change to the project name page
    		Arbiter.changePage_Pop(div_NewProjectPage);
    	}
    },
    
    onSetAreaOfInterest: function() {
    	
    	// if creaing a new project, aoi will be null
    	if (Arbiter.currentProject && Arbiter.currentProject.aoi === null){
        	Arbiter.onCreateProject();
    	} else {
    		// if aoi is not null, means we are changing it from the in project settings menu
    		console.log("---- onSetAreaOfInterest. changing existing aoi");

    		Arbiter.changePage_Pop(div_MapPage);
    		console.log("---- go and show map before starting to cache");

    		var successSaveAreaOfInterest = function(tx, res){
        		console.log("---- try to start caching");
    			
    			var successCacheTiles = function(){
        			console.log("**** now resync vector data");
        			
        			console.log('~~~ zoom to extent');
        			map.zoomToExtent(Arbiter.currentProject.aoi, true);
    				
    				//TODO: this really should happen after showmap completes
        			jqSyncUpdates.click();
    			};

    			TileUtil.cacheTiles(successCacheTiles);    				
    		};
    		Arbiter.saveAreaOfInterest(false, successSaveAreaOfInterest);
    	}
    	
    },
    
    saveAreaOfInterest: function(insertNotUpdate, successCallback) {
		Arbiter.currentProject.aoi = aoiMap.getExtent();

		var statement = "";
		
		if (insertNotUpdate) {
			statement = "INSERT INTO settings (aoi_left, aoi_bottom, aoi_right, aoi_top) VALUES (?, ?, ?, ?);";
		} else {
			 //fake where clause. change table to key value json pair!
			statement = "UPDATE settings SET aoi_left=?, aoi_bottom=?, aoi_right=?, aoi_top=? WHERE aoi_left <> '';"; 
		}

		Cordova.transaction(Arbiter.currentProject.variablesDatabase, statement, [Arbiter.currentProject.aoi.left, Arbiter.currentProject.aoi.bottom, Arbiter.currentProject.aoi.right, Arbiter.currentProject.aoi.top], 
				successCallback, Arbiter.error);
	},
	
	createBaseLayer: function(serverName, layerName){
		console.log("---- createBaseLayer");
		var layer = null; 
		
		if (serverName === "openstreetmap.org") {
			layer = new OpenLayers.Layer.OSM('OpenStreetMap', null, {
					transitionEffect : 'resize',
					singleTile : false,
					ratio : 1.3671875,
					isBaseLayer : true,
					visibility : true,
					getURL : TileUtil.getURL
				}			
			);    	
		} else {
			var serverInfo = Arbiter.currentProject.serverList[serverName];
			
	    	//TODO: use png not jpg
			layer = new OpenLayers.Layer.WMS("baseLayer", serverInfo.url + "/wms", {
				layers : layerName, //"TD1-BaseMap-Group",
				transparent : false,
				isBaseLayer : true,
				visibility : true,
				getURL : TileUtil.getURL
			});
		}
		console.log("---- createBaseLayer, DONE");
		
		return layer;
	},
	
	getProjectProperty: function(key, foundKeyCallback, notFoundKeyCallback, convertValueToJSON) {
		
		if (typeof key !== "string") {
			Arbiter.error("getProjectProperty: key must be a string");
			return;
		}
		
		Arbiter.currentProject.variablesDatabase.transaction(function(tx){
			var statement = "SELECT key, value FROM properties WHERE key=?;";
			tx.executeSql(statement, [key], function(tx, res){

				if (res.rows.length === 0){
					
					if (notFoundKeyCallback){
						notFoundKeyCallback(key);
					}
						
				} else if (res.rows.length === 1){
					
					if (foundKeyCallback){
						var valueReturn = res.rows.item(0).value;
						
						if (convertValueToJSON) {
							valueReturn = JSON.parse(res.rows.item(0).value);
						}
						
						foundKeyCallback(key, valueReturn);
					}
												
				} else {
					// should not happen
					Arbiter.error("getProjectProperty: Multiple entries for property: " + key);
				}
			}, function(e1, e2) {
				Arbiter.error("getProjectProperty.err1", e1, e2);
			});
		}, function(e1, e2) {
			Arbiter.error("getProjectProperty.err1", e1, e2);
		});	
	},

	setProjectProperty: function(key, value, successCallback) {

		if (typeof key !== "string") {
			Arbiter.error("setProjectProperty: key must be a string");
			return;
		}
		
		var valueString = value;
		
		if (typeof value !== "string") {
			valueString = JSON.stringify(value, null, 2);
		}
		
		Arbiter.currentProject.variablesDatabase.transaction(function(tx){
			var statement = "SELECT key, value FROM properties WHERE key=?;";
			tx.executeSql(statement, [key], function(tx, res){

				if (res.rows.length === 0){
					
					Arbiter.currentProject.variablesDatabase.transaction(function(tx){
						var statement = "INSERT INTO properties (key, value) VALUES (?, ?);";
						tx.executeSql(statement, [key, valueString], function(tx, res){
							console.log("inserted property. key: ", key, ", value: ", valueString);
							//alert("inserted a property");
							
							if (successCallback){
								successCallback(key, valueString);
							}
						}, function(e1, e2) {
							Arbiter.error("setProjectProperty.err3", e1, e2);
						});
					}, function(e1, e2) {
						Arbiter.error("setProjectProperty.err4", e1, e2);
					});							
						
				} else if (res.rows.length === 1){

					Arbiter.currentProject.variablesDatabase.transaction(function(tx){
						var statement = "UPDATE properties SET value=? WHERE key=?;";
						tx.executeSql(statement, [valueString, key], function(tx, res){
							console.log("updated property. key: ", key, ", value: ", valueString);
							//alert("updated a property");
							
							if (successCallback){
								successCallback(key, valueString);
							}							
						}, function(e1, e2) {
							Arbiter.error("setProjectProperty.err1", e1, e2);
						});
					}, function(e1, e2) {
						Arbiter.error("setProjectProperty.err2", e1, e2);
					});							
						
				} else {
					// should not happen
					Arbiter.error("setProjectProperty: Multiple entries for property: " + key);
				}
			}, function(e1, e2) {
				Arbiter.error("setProjectProperty.err5", e1, e2);
			});
		}, function(e1, e2) {
			Arbiter.error("setProjectProperty.err6", e1, e2);
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
	
	showMessageOverlay: function(title, message) {
		$("#idWorkingOverlay").animate({ "left": "0%" }, 5);
		Arbiter.setMessageOverlay(title, message);
	},
	
	setMessageOverlay: function(title, message) {
		
		if (!title){
			title = "";
		}
		
		if (!message){
			message = "";
		}
		
		$("#idWorkingOverlayTitle").html("<center>" + title + "</center>");
		$("#idWorkingOverlayMessage").html("<center>" + message + "</center>");
	},
	
	hideMessageOverlay: function() {
		$("#idWorkingOverlay").animate({ "left": "100%" }, 5);
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
	
	addAOIToMap: function() {
		
		if (Arbiter.currentProject && Arbiter.currentProject.aoi && map) {
	    	var geometry = Arbiter.currentProject.aoi.toGeometry();
	    	var attributes = {name: "Area of Interest"};
	    	var feature = new OpenLayers.Feature.Vector(geometry, attributes);
	    	var layer = new OpenLayers.Layer.Vector("AreaOfInterest", { styleMap: aoiStyleMap });
			layer.addFeatures([feature]);
			
			var oldLayers = map.getLayersByName("AreaOfInterest");
			
			if (oldLayers.length) {
				map.removeLayer(oldLayers[0]);
			}
			
			map.addLayer(layer);
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
	
	populateAddServerDialog: function(){
		jqNewNickname.val("");
		jqNewServerURL.val("http://");
		jqNewUsername.val("");
		jqNewPassword.val("");

		Arbiter.changePage_Pop(jqAddServerPage);
	},
	
	PopulateServersList: function() {
		//Fill the servers list (id=idServersList) with the ones that are available.
		// - Make the div's id = to ServerID number;
		console.log("PopulateServersList");
		
		//clear the list
		if(Arbiter.serversList) {
			Arbiter.serversList.clearList();
		}
		
		if(!map){
			//Load servers that are available
			// - add them to the ServersList
			Cordova.transaction(Arbiter.globalDatabase, "select * from servers;", [], function(tx, res){
				var serverName = "";
				
				for(var i = 0; i < res.rows.length; i++){
					serverName = res.rows.item(i).name;
					Arbiter.serversList.append(res.rows.item(i).name,{
						serverid: res.rows.item(i).id,
						servername: serverName
					}, (Arbiter.currentProject.serverList[serverName]) ? true : false);
				}
			}, Arbiter.error);
		}else{
			for(var key in Arbiter.currentProject.serverList){
				var server = Arbiter.currentProject.serverList[key];
				Arbiter.serversList.append(key, {
					serverid: server.serverId,
					servername: key
				}, true);
			}
		}
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
						console.log("update project name: " + oldName);
						Cordova.transaction(Arbiter.globalDatabase, 'UPDATE projects SET name=? WHERE name=?;', [newName, oldName], function(tx, res){
							console.log("update project name success");											 

						}, Arbiter.error);
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
		/*$(_item).appendTo(_listview).click(_click);
		
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
	
	readLayer: function(server, layer, serverName, layerName, addedInProject){
		console.log("read layer: layerName - " + layerName + ", serverName - " + serverName, server, layer);
		var color = layerColors[map.getNumLayers() % layerColors.length];
		
		Arbiter.AddLayer({
			featureNS: layer.featureNS,
			url: server.url,
			geomName: layer.geomName,
			featureType: layer.featureType, //e.g. hospitals
			typeName: layer.typeName, //e.g. medford:hospitals
			srsName: layer.srsName,
			nickname: layerName,
			username: server.username,
			password: server.password,
			serverName: serverName, 
			color: color
		});
		console.log("added layer");
		
		
		var li = "";
		li += "<li style='padding:5px; border-radius: 4px; color: " + color + ";'>";
		li += "<input type='radio' name='radio-choice' id='" + layerName;
		li += "' value='choice-";
		li += Arbiter.radioNumber + "'";
		
		//TODO: Save this value for repeated visits.
		Arbiter.currentProject.currentLayerRadioNumber = 1;
		if(Arbiter.radioNumber == Arbiter.currentProject.currentLayerRadioNumber) {
			li += "checked='checked'/>";
			Arbiter.currentProject.activeLayer = layerName;
			Arbiter.currentProject.modifyControls[Arbiter.currentProject.activeLayer].modifyControl.activate();
		} else {
		 	li += "/>";
		}
		li += "<label for='radio-choice-" + Arbiter.radioNumber + "'>";
		li += serverName + " / " + layerName;
		li += "</label>";
		Arbiter.radioNumber++;
		 
		//add the data from local storage
		console.log("checking scope issue with readLayerFromDb call", layer);
		Arbiter.readLayerFromDb(layer.featureType, layerName, layer.geomName, layer.srsName);
		$("ul#editor-layer-list").append(li);
		
		if(addedInProject){
			$("ul#editor-layer-list").listview("refresh");
		}
	},
	
	readLayers: function(serverList){
		var layers;
		console.log("readLayers " + Arbiter.radioNumber + ": " + serverList);
		for(var x in serverList){
			layers = serverList[x].layers;
			
			for(var y in layers){
				Arbiter.readLayer(serverList[x], layers[y], x, y, false);
			}
		}
	},
	
	setLayerAttributeInfo: function(serverList, layername, f_table_name){
		console.log("layername: " + layername + ", f_table_name: " + f_table_name, serverList);
		// get the geometry name, type, and srs of the layer
		var geomColumnsSql = "SELECT * FROM geometry_columns where f_table_name='" + f_table_name + "';";

		Cordova.transaction(Arbiter.currentProject.dataDatabase, geomColumnsSql, [], function(tx, res) {
			var geomName;
			//var server = Arbiter.currentProject.serverList[serverName];
			var serverLayer = serverList.layers[layername];
			console.log("serverLayer: bugga", serverLayer);
			if (res.rows.length) { // should only be 1 right now
				console.log("geometry_columns: ", res.rows.item(0));
				geomName = res.rows.item(0).f_geometry_column;

				// get the attributes of the layer
				var tableSelectSql = "PRAGMA table_info (" + f_table_name + ");";

				serverLayer.geomName = geomName;
				serverLayer.srsName = res.rows.item(0).srid;
				serverLayer.geometryType = res.rows.item(0).geometry_type;

				Cordova.transaction(Arbiter.currentProject.dataDatabase, tableSelectSql, [], function(tx, res) {
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
				}, Arbiter.error);
			}
		}, Arbiter.error);
	},
	
	//if the serverName doesn't exist, use the serverList object
	//otherwise use the deletedServers object
	setServerLayers : function(serverId, serverName) {
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
			Cordova.transaction(Arbiter.currentProject.variablesDatabase, "SELECT * FROM layers where server_id=?", [serverId], function(tx, res) {
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

					Arbiter.setLayerAttributeInfo(serversList, layer.layername, layer.f_table_name);
				}

				//TODO: this doesn't seem to be a good place to switch to map page... 
				//      looks like this may get called multiple times from a parent function that is in a loop. 
				Arbiter.changePage_Pop(div_MapPage);
			}, Arbiter.error);
	},

	deleteFeature: function(feature){
		var f_table_name = feature.layer.protocol.featureType;
		if(feature.fid == undefined || feature.fid == ''){
			feature.layer.destroyFeatures([ feature ]);
			Cordova.transaction(Arbiter.currentProject.dataDatabase, "DELETE FROM " + f_table_name + " WHERE id=?;", [feature.rowid], function(tx, res){
				console.log("local feature successfully deleted");
				//Arbiter.currentProject.modifyControls[Arbiter.currentProject.activeLayer].modifyControl.activate();
			});
		}else{
			feature.state = OpenLayers.State.DELETE;
			feature.layer.events.triggerEvent("afterfeaturemodified", {
				feature : feature
			});
			feature.renderIntent = "select";
			feature.layer.drawFeature(feature);
			
			var insertDirtySql = "INSERT INTO dirty_table (f_table_name, fid, state) VALUES (?,?,?);";
			  
			console.log(insertDirtySql);
			Cordova.transaction(Arbiter.currentProject.variablesDatabase, insertDirtySql, [f_table_name, feature.fid, 0], function(tx, res){
				console.log("insert dirty success delete");
				//Arbiter.currentProject.modifyControls[Arbiter.currentProject.activeLayer].modifyControl.activate();
			}, function(e){
				console.log("insert dirty fail delete: ", e);
			});
		}
	},
	
	deleteLayer: function(servername, layername){
		Cordova.transaction(Arbiter.currentProject.variablesDatabase, "DELETE FROM layers WHERE layername=?;", [layername], function(tx, res){
			var server = Arbiter.currentProject.serverList[servername];
			var layer = server.layers[layername];
			Cordova.transaction(Arbiter.currentProject.dataDatabase, "DELETE FROM geometry_columns WHERE f_table_name=?", [layer.featureType], function(tx, res){
				Cordova.transaction(Arbiter.currentProject.dataDatabase, "DROP TABLE " + layer.featureType, [], function(tx, res){
					console.log("before_delete: success! " + servername + ", " + layername);
					
					//TODO: why is destroy not working?
					var wfsLayer = map.getLayersByName(layername + '-wfs');
					
					console.log("before_delete: wfsLayer - ", wfsLayer);
					if(wfsLayer.length){
						map.removeLayer(wfsLayer[0]);
						//wfsLayer[0].destroy();
					}
					
					var wmsLayer = map.getLayersByName(layername + '-wms');
					console.log("before_delete: wmsLayer - ", wmsLayer);
					
					if(wmsLayer.length){
						map.removeLayer(wmsLayer[0]);
						//wmsLayer[0].destroy();
					}
					
					console.log("before remove layer from currentProject obj " + servername + ", " + layername);
					delete Arbiter.currentProject.serverList[servername].layers[layername];
					
					//deleteRow();
					Arbiter.layersSettingsList.deleteListItem("layername", layername);
					
					console.log("after delete list item");
					if(Arbiter.currentProject.activeLayer == layername){
						Arbiter.currentProject.activeLayer = null;
					}
					
					console.log("before deleting modify controls: " + layername, Arbiter.currentProject.modifyControls);
					/*
					 * Delete the controls for editing the layer
					 */
					var controls = Arbiter.currentProject.modifyControls[layername];
					map.removeControl(controls.modifyControl);
					map.removeControl(controls.insertControl);
					controls.modifyControl.destroy();
					controls.insertControl.destroy();
					delete Arbiter.currentProject.modifyControls[layername];
					
					console.log("after delete modify controls");
					$('ul#editor-layer-list #' + layername).parent().remove();
					
					//Arbiter.tempDeleteLayerFromProject = null;
					Arbiter.deleteLayerCount--;
					
					if(Arbiter.deleteLayerCount == 0){
						console.log("layers all deleted - time to party!");
						
						if(!Arbiter.deletingLayersInfo.layername){
							Cordova.transaction(Arbiter.currentProject.variablesDatabase, "DELETE FROM servers WHERE server_id=?;", [server.serverId], function(tx, res){
								console.log(servername + " deleted!");
								Cordova.transaction(Arbiter.globalDatabase, "DELETE FROM server_usage WHERE project_id=?;", [Arbiter.currentProject.projectId], function(tx, res){
									console.log(servername + " usage deleted!");
									delete Arbiter.currentProject.serverList[servername];
								}, function(tx, err){
									console.log(servername + " usage deletion fail!", err);
								});
							}, function(tx, err){
								console.log(servername + "deletion fail!", err);
							});
							Arbiter.serversList.deleteListItem("servername", servername);
						}
						
						Arbiter.deletingLayersInfo = null;
					}
				})
			});
		}, Arbiter.error);
	},
	
/*	deleteLayers: function(){
		if(Arbiter.deletingLayersInfo && Arbiter.deletingLayersInfo.servername){
			if(Arbiter.deletingLayersInfo.layername){
				console.log("deleting a layer");
				Arbiter.deleteLayerCount = 1;
				Arbiter.deleteLayer(Arbiter.deletingLayersInfo.servername, Arbiter.deletingLayersInfo.layername);
			}else{
				console.log("deleting a server");
				var layers = Arbiter.currentProject.serverList[Arbiter.deletingLayersInfo.servername].layers;
				Arbiter.deleteLayerCount = Arbiter.getAssociativeArraySize(layers);
				for(var layername in layers){
					Arbiter.deleteLayer(Arbiter.deletingLayersInfo.servername, layername);
				}
			}
		}
	},*/
	
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
		}else {
			args.jqpassword.removeClass('invalid-field');
		}
			
		Cordova.transaction(Arbiter.globalDatabase, "SELECT * FROM servers;", [], function(tx, res){
			var serverName = "";
					
			for(var i = 0; i < res.rows.length; i++){
				serverName = res.rows.item(i).name;
				if(nickname == serverName) {
					args.jqnickname.addClass('invalid-field');
					args.jqnickname.val("");
					args.jqnickname.attr("placeholder", 'Server "' + nickname + '"already exists! *');
					valid = false;
				}
			}
		}, Arbiter.error);
		
		if(!nickname){
			args.jqnickname.addClass('invalid-field');
			args.jqnickname.val("");
			args.jqnickname.attr("placeholder", "Please enter a Nickname. *");
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
	
	
	onClick_AddServerBack : function() {
		jqNewNickname.removeClass('invalid-field');
		jqNewServerURL.removeClass('invalid-field');
		jqNewUsername.removeClass('invalid-field');
		jqNewPassword.removeClass('invalid-field');

		jqAddServerButton.removeClass('ui-btn-active');
	},
	
	onClick_EditServerBack : function() {
		jqEditUsername.removeClass('invalid-field');
		jqEditPassword.removeClass('invalid-field');
		jqEditNickname.removeClass('invalid-field');
		jqEditServerURL.removeClass('invalid-field');
		
		jqEditServerButton.removeClass('ui-btn-active');
	},
	
	onClick_AddServer: function() {
		//TODO: Add the new server to the server list
		console.log("User wants to submit a new server.");

		var args = {
			jqusername: jqNewUsername,
			jqpassword: jqNewPassword,
			jqurl: jqNewServerURL,
			jqnickname: jqNewNickname
		};

		jqAddServerButton.removeClass('ui-btn-active');
		
		args.func = function(){
			var name = jqNewNickname.val();
			var url = jqNewServerURL.val();
			var username = jqNewUsername.val();
			var password = jqNewPassword.val();
			
			//It's a new server so add it to the global servers table
			var insertServerSql = "INSERT INTO servers (name, url, username, password) VALUES (?, ?, ?, ?);";

			var success = function(serverId){
				jqNewUsername.removeClass('invalid-field');
				jqNewPassword.removeClass('invalid-field');
							 
				Arbiter.currentProject.serverList[name] = {
					url: url,
					username: username,
					password: password,
					serverId: serverId,
					layers: {}
				};
							 
				window.history.back();
			};

			Cordova.transaction(Arbiter.globalDatabase, insertServerSql, [name, url, username, password], function(tx, res){
				var serverId = res.insertId;
				if(map && Arbiter.currentProject.variablesDatabase){
					Arbiter.insertProjectsServer(serverId, name, function(tx, res){
						Arbiter.insertServerUsage(Arbiter.currentProject.projectId, serverId, function(tx, res){
							
							success(serverId);
						});
					});
				}else{
					success(serverId);
				}
			}, Arbiter.error);
		};
		
		if(Arbiter.validateAddServerFields(args)){
			Arbiter.authenticateServer(args);
		}
	},
	
	restExistingServersCheckboxes: function() {
		$('.existingServer-checkbox').each(function(index) {
		    $(this).prop('checked', false);
		});		
	},
	
	addServersToLayerDropdown: function() {
		console.log('addServersToLayerDropdown: ' );
		console.log(Arbiter.currentProject.serverList);
		
		// initialize the select menue. in some cases it might not be initialized already
		// such as when a project open and you go directly to edit a layer 
		jqServerSelect.selectmenu();
		
		//Clear the list
		jqServerSelect.empty();
		
		//Choose your server option
		var option = '<option value="" data-localize="label.chooseAServer">Choose a server...</option>';
		jqServerSelect.append(option);

		//Add all the servers to the list
		for(var key in Arbiter.currentProject.serverList) {
			option = '<option value="' + key + '">' + key + '</option>';
			jqServerSelect.append(option);
		}
	
		// build the list
		jqServerSelect.selectmenu('refresh', true);
		
//		if(jqServerSelect.parent().parent().hasClass('ui-select')) {
//		}
		
		console.log('addServersToLayerDropdown, done ' );
	},
	
	onClick_EditServer: function() {
		//TODO: Add the new server to the server list
		var args = {
			jqusername: jqEditUsername,
			jqpassword: jqEditPassword,
			jqurl: jqEditServerURL,
			jqnickname: jqEditNickname
		};
		jqEditServerButton.removeClass('ui-btn-active');
		
		args.func = function(){
			var username = jqEditUsername.val();
			var password = jqEditPassword.val();
			var name = jqEditNickname.val();
			var url = jqEditServerURL.val();
			var id = jqEditServerButton.attr('server-id');	
			var oldname = jqEditServerButton.attr('server-name');
				var updatesql = "UPDATE servers SET name=?, username=?, password=?, url=? WHERE id=?";
				Cordova.transaction(Arbiter.globalDatabase, updatesql,[name, username, password, url, id], function(tx, res){
							  console.log("server update success");
					jqEditUsername.removeClass('invalid-field');
					jqEditPassword.removeClass('invalid-field');
					
					
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
							  
					window.history.back();

				},  Arbiter.error);

		};
		
		if(Arbiter.validateAddServerFields(args)){
			Arbiter.authenticateServer(args);
		}
	},
	
	onClick_DeleteServer: function(itemInfo, deleteRow){
		console.log("onClick_DeleteServer");
		
		var removeFromProject = function(){
			//remove from the currentProject object
			if(Arbiter.currentProject.serverList[itemInfo.servername]){
				delete Arbiter.currentProject.serverList[itemInfo.servername];
			}
			
			deleteRow();
		};
		
		var deleteServer;
		
		if(!map){ // global
			deleteServer = function(){
				//delete the server from the globalDatabase
				Cordova.transaction(Arbiter.globalDatabase, "DELETE FROM servers WHERE id=?", [itemInfo.serverid], function(tx, res){
					removeFromProject();
				}, function(e){
					console.log("delete server err: ", e);
				});								   
			};
			
			Cordova.transaction(Arbiter.globalDatabase, "SELECT * FROM server_usage WHERE server_id=?", [itemInfo.serverid], function(tx, res){
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
			}, function(e){
				console.log("check server_usage err:", e);
			});
		}else{ // project
			deleteServer = function(){
				//sync with the server
				
				//remove the server
				
				//remove the server from the server_usage table for that project
				//Cordova.transaction(Arbiter.currentProject.variablesDatabase, )
			};
			
		}
	},
	
	onClick_EditLayers: function() {
		//TODO: Make the servers List editable
		console.log("User wants to edit his/her layers.");
	},
	
	createMetaTables: function(){
		var createServersSql = "CREATE TABLE IF NOT EXISTS servers (id integer primary key, server_id integer not null);";
		Cordova.transaction(Arbiter.currentProject.variablesDatabase, createServersSql, [],
			function(tx, res){ console.log("createServersSql win!"); }, function(e){ console.log("Error createServersSql - " + e); });
		
		var createDirtyTableSql = "CREATE TABLE IF NOT EXISTS dirty_table (id integer primary key, f_table_name text not null, fid text not null, state integer not null);";
		Cordova.transaction(Arbiter.currentProject.variablesDatabase, createDirtyTableSql, [],
			function(tx, res){ console.log("createDirtyTableSql win!"); }, function(e){ console.log("Error createDirtyTableSql - " + e); });
		
		var createSettingsTableSql = "CREATE TABLE IF NOT EXISTS settings (id integer primary key, aoi_left text not null, " +
		"aoi_bottom text not null, aoi_right text not null, aoi_top text not null);";
		Cordova.transaction(Arbiter.currentProject.variablesDatabase, createSettingsTableSql, [],
			function(tx, res){ console.log("createSettingsTableSql win!"); }, function(e){ console.log("Error createSettingsTableSql - " + e); });
		
		var createLayersTableSql = "CREATE TABLE IF NOT EXISTS layers (id integer primary key, server_id integer, " + 
		"layername text not null, f_table_name text not null, featureNS text not null, typeWithPrefix text not null, " +
		"FOREIGN KEY(server_id) REFERENCES servers(id));";
		Cordova.transaction(Arbiter.currentProject.variablesDatabase, createLayersTableSql, [],
			function(tx, res){ console.log("createLayersTableSql win!"); }, function(e){ console.log("Error createLayersTableSql - " + e); });
		
		
		// every project has a list of tiles it uses so that:
		// - when the project is removed, the global tile's reference counter can be decremented.
		// - when a project's tiles need to updated, we can potentially used this list... though normally, they will pull data in area of interest. 
		var createTileIdsSql = "CREATE TABLE IF NOT EXISTS tileIds (id integer not null primary key);";  
		Cordova.transaction(Arbiter.currentProject.variablesDatabase, createTileIdsSql, [], function(tx, res){
			console.log("project tileIds table created");
		});

		// every project has a properties table which can be used to store any key-value pair
		var createPropertiesSql = "CREATE TABLE IF NOT EXISTS properties (key text not null primary key, value text not null);";  
		Cordova.transaction(Arbiter.currentProject.variablesDatabase, createPropertiesSql, [], function(tx, res){
			console.log("project properties table created");
		});
	},
	
	createDataTables: function(){
		
		var createGeometryColumnsSql = "CREATE TABLE IF NOT EXISTS geometry_columns (f_table_name text not null, " +
		"f_geometry_column text not null, geometry_type text not null, srid text not null, " +
		"PRIMARY KEY(f_table_name, f_geometry_column));";
		
		Cordova.transaction(Arbiter.currentProject.dataDatabase, createGeometryColumnsSql, [],
			function(tx, res){ console.log("createGeometryColumnsSql win!"); }, function(e){ console.log("Error createGeometryColumnsSql - " + e); });
	},
	
	getProjectDirectory: function(_projectName, _successCallback, _errorCallback) {
		Arbiter.fileSystem.root.getDirectory(_projectName, null, _successCallback, _errorCallback);
	},
	
	failedGetProjectDirectory: function(error) {
		console.log("Failed to read Project Directory.");
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
		
		jqLayerSubmit.removeClass('ui-btn-active');
		
		if(valid){
			var serverName = jqServerSelect.val();
			var serverInfo = Arbiter.currentProject.serverList[serverName];
			var typeName = jqLayerSelect.val();

			jqLayerNickname.removeClass('invalid-field');
			
			var request = new OpenLayers.Request.GET({
				url: serverInfo.url + "/wfs?service=wfs&version=1.1.0&request=DescribeFeatureType&typeName=" + typeName,
				callback: function(response){
					console.log('response for get info on wms: ', response );
					var obj = describeFeatureTypeReader.read(response.responseText);
													 
					if(obj.featureTypes && obj.featureTypes.length){
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
						
						//var selectedOption = jqLayerSelect.val();

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
							
						//TODO: ummm, this needs to be fixed. 
						if(awayFromMap){
							Arbiter.layerCount = 1;
							Arbiter.insertProjectsLayer(serverInfo.serverId, serverName, layernickname, serverInfo.layers[layernickname], true);
						}													 
						
					}else{
						alert("layer will be added but can only be used as a base layer");
						
						var selectedOption = jqLayerSelect.find('option:selected');

						var layernickname = jqLayerNickname.val();
						//serverId, layerName, layer.featureType, layer.featureNS, layer.typeName
						serverInfo.layers[layernickname] = {
							featureType: "", // no feature type means wms?
							featureNS: "",
							typeName: typeName,
							srsName: selectedOption.attr('layersrs')
						};
							
						//TODO: ummm, this needs to be fixed. 
						if(awayFromMap){
							Arbiter.layerCount = 1;
							Arbiter.insertProjectsLayer(serverInfo.serverId, serverName, layernickname, serverInfo.layers[layernickname], true);
						}							

					}
													 
					window.history.back();
				}
			});
		} else {
			Arbiter.error('Selected layer is not valid');
		}
	},
	
	onAddLayerPage: function(_layerNickName, _layerTypeName, _serverName){
		console.log('onAddLayerPage');
		console.log("_serverName ", _serverName);
		console.log("_layerNickName ", _layerNickName);
		console.log("_layerTypeName ", _layerTypeName);

		Arbiter.addServersToLayerDropdown();
		
		// if this is a new layer
		if (!_layerNickName){
			console.log("onAddLayerPage.Add layer");
			
			// if we only have one server, select it
			var severListKeys = Object.keys(Arbiter.currentProject.serverList);
			if (severListKeys.length === 1){
				Arbiter.enableLayerSelectAndNickname();
				jqServerSelect.val(severListKeys[0]).change();
			} else {
				Arbiter.disableLayerSelectAndNickname();
			}
		} else {
			// if this is editing an existing layer
			console.log("onAddLayerPage.Edit layer");

			Arbiter.enableLayerSelectAndNickname();

			jqLayerNickname.val(_layerNickName);

			// set server name and refresh but do not cause a change event 
			jqServerSelect.val(_serverName);
			jqServerSelect.selectmenu('refresh', true);
						
			// wait for the layer list to make it back from the server, then try to select the layer
			// when teh layer page opens we might still be waiting for server's response 
			Arbiter.addLayersOnServerToLayerDropdown(_serverName, function(){
				jqLayerSelect.val(_layerTypeName);
				jqLayerSelect.selectmenu('refresh', true);
			})
		}
		
		Arbiter.changePage_Pop(div_AddLayerPage);
	},
	
	//override: Bool, should override
	pullFeatures: function(featureType, geomName, f_table_name, srs, serverUrl, username, password, addProjectCallback, layernickname){
		console.log("pullFeatures: " + featureType + "," + geomName + "," + f_table_name + "," + srs + "," + serverUrl + "," + username + "," + password + "," + layernickname);
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
												  
					console.log("pragma transaction table name: " + f_table_name);
					Cordova.transaction(Arbiter.currentProject.dataDatabase, "PRAGMA table_info (" + f_table_name + ");", [], function(tx, res){
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
						
					}, Arbiter.error);
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
		//Clear the list
		jqLayerSelect.empty();
		
		//Choose your server option
		var option = '<option value="" data-localize="label.chooseALayer">Choose a layer...</option>';
		jqLayerSelect.append(option);
		
		//jqLayerSelect.parent().addClass('ui-disabled').attr('aria-disabled', 'true');
		//jqLayerSelect.attr('disabled', 'disabled').attr('aria-disabled', 'true').addClass('mobile-selectmenu-disabled ui-state-disabled');
		
		jqLayerNickname.val("");
		//jqLayerNickname.attr('disabled', 'disabled');
		
		if(jqLayerSelect.parent().parent().hasClass('ui-select')) {
			jqLayerSelect.selectmenu('refresh', true);
		}
	},
	
	addLayersOnServerToLayerDropdown: function(serverName, successCallback){
		console.log('addLayersOnServerToLayerDropdown');
		
		// initialize the select element as in some situation it might not have already been initialized
		jqLayerSelect.selectmenu();
		
		var serverInfo = Arbiter.currentProject.serverList[serverName];
		var request = new OpenLayers.Request.GET({
			url: serverInfo.url + "/wms?service=wms&version=1.1.1&request=getCapabilities",
			user: serverInfo.username,
			password: serverInfo.password,
			callback: function(response){
				console.log('addLayersOnServerToLayerDropdown success');
				var capes = capabilitiesFormatter.read(response.responseText);
				var options = '<option value="" data-localize="label.chooseALayer">Choose a Layer...</option>';
				
				if(capes && capes.capability && capes.capability.layers){
					var layer;
					var layersrs;
					var layerList = capes.capability.layers;
					layerList.sort(function(a, b){
						var titleA = a.title.toLowerCase();
						var titleB = b.title.toLowerCase();
						if(titleA < titleB) return -1;
						if(titleA > titleB) return 1;
						return 0;
					});
					
					for(var i = 0;i < layerList.length;i++){
						layer = layerList[i];
						
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
							
					jqLayerSelect.html(options).selectmenu('refresh', true);
					
					Arbiter.enableLayerSelectAndNickname();
					
					if (successCallback) {
						successCallback();
					}
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
	
	error: function(arg1){
		console.log('==== Arbiter.error');
		
		var argsStr = "";
		
		for(var i = 0; i < arguments.length; i++) {
			var val = "_undefined_";
			
			if (typeof arguments[i] !== 'undefined'){ 
				val = arguments[i];
			}
			
			console.log("arg" + i + ": ", val);
			
			if (argsStr !== "") {
				argsStr += ", ";
			}
			
			argsStr += "arg" + i + ": " + val;
		}
		
		console.log("args as string: " + argsStr);
		var trace = Arbiter.getStackTrace();
		
		console.log("StackTrace: \n" + trace);
		
		if (Arbiter.debugAlertOnError) {
			alert("ERORR: " + argsStr + "\n" + trace);
		}		
	},
	
	warning: function(arg1){
		console.log('==^^ Arbiter.warning');
		
		var argsStr = "";
		
		for(var i = 0; i < arguments.length; i++) {
			var val = "_undefined_";
			
			if (typeof arguments[i] !== 'undefined'){ 
				val = arguments[i];
			}
			
			console.log("arg" + i + ": ", val);
			
			if (argsStr !== "") {
				argsStr += ", ";
			}
			
			argsStr += "arg" + i + ": " + val;
		}
		
		console.log("args as string: " + argsStr);
		var trace = Arbiter.getStackTrace();
		
		console.log("StackTrace: \n" + trace);
		
		if (Arbiter.debugAlertOnWarning) {
			alert("Just WARNING: " + argsStr + "\n" + trace);
		}		
	},
	
	getStackTrace: function() {
		var callstack = [];
			
		if (typeof resolveFunctionNamesFrom === 'undefined') {
			//TODO: add other objects that we can use to resolve member function
			resolveFunctionNamesFrom = new Array(Arbiter, TileUtil);
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
			if (fname === "function" && Arbiter.debugCallstack){
				console.log("====[ dumping content of anon function: ");
				console.log(currentFunction);
			}
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
			Cordova.transaction(Arbiter.currentProject.dataDatabase, "SELECT * FROM " + tableName, [], function(tx, res){
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
					Cordova.transaction(Arbiter.currentProject.variablesDatabase, "SELECT * FROM dirty_table where f_table_name='" + tableName + "';", [], function(tx, res){
						for(var i = 0; i < res.rows.length;i++){
							var feature = layer.getFeatureByFid(res.rows.item(i).fid);
							feature.modified = true;
							
							if(res.rows.item(i).state == 0){
								//set the feature state so it get's saved appropriately
								feature.state = OpenLayers.State.DELETE;
								
								layer.events.triggerEvent("afterfeaturemodified", {
									feature : feature
								});
								feature.renderIntent = "select";
								layer.drawFeature(feature);
							}else{
								feature.state = OpenLayers.State.UPDATE;
							}
						}
					}, function(e){
						console.log("err: ", e);
					});

			}, Arbiter.error);
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
			deletedServers: {},
			baseLayerInfo: null
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
	
	insertFeaturesIntoTable: function(features, f_table_name, geomName, srsName, isEdit, addProjectCallback, layername){
		console.log("insertFeaturesIntoTable: ", features);
		console.log("other params: " + f_table_name + geomName + srsName + isEdit);
		
		//Arbiter.tempDeleteCountFeatures = 0;
		
		if(!features.length){
			if(addProjectCallback){
				addProjectCallback(features.length);
			}
			
			/*if(Arbiter.tempDeleteLayerFromProject){
				Arbiter.tempDeleteLayerFromProject();
			}*/
		}
		
		/*if(addProjectCallback && !features.length)
			addProjectCallback.call(Arbiter, features.length);
		
		if(Arbiter.tempDeleteLayerFromProject && !features.length)
			Arbiter.tempDeleteLayerFromProject();*/
		
		for(var i = 0; i < features.length; i++){
			var feature = features[i];
			Arbiter.tableInsertion(f_table_name, feature, geomName, isEdit, srsName, addProjectCallback, layername, features.length);
		}
	},
	
	tableInsertion: function(f_table_name, feature, geomName, isEdit, srsName, addProjectCallback, layername, featuresLength){
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
							  
			console.log(selectSql);
			console.log(selectParams);
							  
			Cordova.transaction(Arbiter.currentProject.dataDatabase, selectSql, selectParams, function(tx, res){
				//console.log(updateList);
				//If this exists, then its an update, else its an insert
				if(res.rows.length){
					console.log("UPDATE", res.rows.item(0));
					var updateSql = sqlObject.updateSql.substring(0, sqlObject.updateSql.length - 1) + " WHERE id=?";
					console.log("update sql: " + updateSql, sqlObject);
					sqlObject.params.push(res.rows.item(0).id);
												  
					Cordova.transaction(Arbiter.currentProject.dataDatabase, updateSql, sqlObject.params, function(tx, res){
						console.log("update success");
						$("#saveAttributesSucceeded").fadeIn(1000, function(){
							$(this).fadeOut(3000);
						});
																	  
						if(feature.fid){
							//Arbiter.currentProject.variablesDatabase.transaction(function(tx){
							 var insertDirtySql = "INSERT INTO dirty_table (f_table_name, fid, state) VALUES (?,?,?);";
																	  
							console.log(insertDirtySql);
							Cordova.transaction(Arbiter.currentProject.variablesDatabase, insertDirtySql, [f_table_name, feature.fid, 1], function(tx, res){
								console.log("insert dirty success");
							}, function(e){
								console.log("insert dirty fail: ", e);
							});
							//}, Arbiter.errorSql, function(){});
						}
					}, function(e){
						console.log("update err: ", e);
						$("#saveAttributesFailed").fadeIn(1000, function(){
							$(this).fadeOut(3000);
						});
					});
				}else{
					console.log('new insert');
					Cordova.transaction(Arbiter.currentProject.dataDatabase, sqlObject.insertSql, sqlObject.params, function(tx, res){
						console.log("insert success");
						console.log(sqlObject.insertSql);
						console.log(sqlObject.params);
						if(isEdit){
							console.log('isEdit: ' + res.insertId);
							if(res.insertId) //hack because insertId is returned as null for the first insert...
								feature.rowid = res.insertId;
							else
								feature.rowid = 1;
						}else{ // from sync
							console.log("syncing: " + layername + ", ", map);
							if(layername && map){
								var vectorLayer = map.getLayersByName(layername + "-wfs");
								if(vectorLayer.length){
									console.log("insert sync:", feature);
									feature.geometry.transform(new OpenLayers.Projection(srsName), WGS84_Google_Mercator);
									vectorLayer[0].addFeatures([feature]);
									console.log("DEBUGGING: " + Arbiter.currentProject.activeLayer + ", " + layername, selectedFeature, feature, Arbiter.currentProject);
									if(oldSelectedFID && feature && feature.fid){
										console.log("selectedFeature: " + oldSelectedFID);
										console.log("feature: ", feature);
										if(oldSelectedFID == feature.fid){ //means layer == activeLayer
											console.log("the fids are equal");
											selectedFeature = feature;
											if(layername == Arbiter.currentProject.activeLayer){ // it should be the activeLayer
												console.log("the layer is the activeLayer", Arbiter.currentProject.modifyControls);
												if(Arbiter.currentProject.modifyControls[layername]){
													console.log("the modify control exists:", Arbiter.currentProject.modifyControls[layername]);
													Arbiter.currentProject.modifyControls[layername].modifyControl.selectFeature(feature);
												}
											}
										}
									}	
									console.log("insert sync end:", feature);
								}
							}
							
							//If this is a sync before removing a layer from the project,
							//remove the layer from the project.  Arbiter.tempDeleteLayerFromProject
							//is responsible for setting itself to null at its end.
							/*if(Arbiter.tempDeleteLayerFromProject){
								if(++(Arbiter.tempDeleteCountFeatures) == featuresLength)
									Arbiter.tempDeleteLayerFromProject();
							}*/
						}

						if(addProjectCallback)
							addProjectCallback(featuresLength);
					}, function(e){
						console.log("insert err: ", e);
					});
				}
			}, function(e){
				console.log("select err: ", e);
			});
		}else{
			console.log('new insert no id');
			console.log(sqlObject);
			/*var insertSql = "INSERT INTO " + f_table_name + " (" + propertiesList + ") VALUES (" +
			propertyValues + ");";
							   
			console.log(insertSql);*/
			console.log(sqlObject);
			Cordova.transaction(Arbiter.currentProject.dataDatabase, sqlObject.insertSql, sqlObject.params, function(tx, res){
				console.log("insert no id success");
					if(isEdit){
						console.log('isEdit: ' + res.insertId);
						if(res.insertId) //hack because insertid is returned as 1 for the first insert...
							feature.rowid = res.insertId;
						else
							feature.rowid = 1;
					}
				}, function(e){
					console.log("insert err: ", e);
				}
			);
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
					//value = value.toLowerCase();
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
		console.log("Populate Popup");
		console.log(selectedFeature);
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
	AddLayer: function(meta) {
		alter("AddLayer");
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

				Cordova.transaction(Arbiter.currentProject.variablesDatabase, "DELETE FROM dirty_table;", []);

				var url = server.url;
				var username = server.username;
				var password = server.password;
				var typeName = serverLayer.typeName;
				var geomName = serverLayer.geomName;
				var featureType = serverLayer.featureType;
				var srsName = serverLayer.srsName;

				if(Arbiter.deletingLayersInfo){
					/*Arbiter.pullFeatures(serverLayer.typeName, serverLayer.geomName, serverLayer.featureType, serverLayer.srsName, server.url,
							server.username, server.password, function(featureCount){
								console.log("deleteLayerCallback: " + featureIncrement);
								featureIncrement++;
								if(featureIncrement >= featureCount){
									console.log("featureIncrement: " + featureIncrement);
									Arbiter.deleteLayerCount--;
									if(Arbiter.deleteLayerCount == 0){
										if(Arbiter.deletingLayersInfo.layername){
											Arbiter.deleteServer();
											console.log("delete count = 0, now delete the damn server already!");
										}else{
											console.log("must be deleting a single layer!");
										}
										
										Arbiter.deletingLayersInfo = null;
									}else{
										console.log("deleteLayerCount: " + Arbiter.deleteLayerCount);
									 }
								}else{
									console.log("featureIncrement: " + featureIncrement);
								}
							}, meta.nickname);*/
					
					//Arbiter.deleteLayerCount++;
					Arbiter.deleteLayer(meta.serverName, meta.nickname);
				}else{
					Cordova.transaction(Arbiter.currentProject.dataDatabase, "DELETE FROM " + featureType, [], function(tx, res) {
						// pull everything down
								  
						newWFSLayer.destroyFeatures();
						console.log("pull after delete");
						console.log("pullFeatures after delete: " + serverLayer.typeName + serverLayer.geomName + serverLayer.featureType + serverLayer.srsName
								+ server.url + server.username + server.password);
					
						Arbiter.pullFeatures(serverLayer.typeName, serverLayer.geomName, serverLayer.featureType, serverLayer.srsName, server.url,
							server.username, server.password, null, meta.nickname);
					}, function(e){
							console.log("save delete failure:", e);
					});
				}
			});
		}
		
		//TODO: not used?
		var tableName = meta.featureType;
				
		var defaultStyleTable = OpenLayers.Util.applyDefaults({
				fillColor: meta.color,
				strokeColor: meta.color
			},
			OpenLayers.Feature.Vector.style["default"]);
		
		var styleMap = new OpenLayers.StyleMap({
			'default': new OpenLayers.Style(defaultStyleTable),
			'selected': new OpenLayers.Style(OpenLayers.Feature.Vector.style["selected"])
		});

		var newWFSLayer = new OpenLayers.Layer.Vector(meta.nickname + "-wfs", {
			strategies : strategies,
			projection : new OpenLayers.Projection(meta.srsName),
			protocol : protocol,
			styleMap: styleMap
		});		

		newWFSLayer.attributeTypes = {};
		
		for(var i = 0; i < serverLayer.attributes.length;i++)
			newWFSLayer.attributeTypes[serverLayer.attributes[i]] = serverLayer.attributeTypes[i];
		
		newLayers.push(newWFSLayer);
		
		map.addLayers(newLayers);

		var modifyControl = new OpenLayers.Control.ModifyFeature(newWFSLayer);
		
		newWFSLayer.events.register("featuremodified", null, function(event) {
			console.log("feature modified", event);
			console.log("featuremodified modify Control feature", modifyControl.feature);
			if(!jqDeleteFeatureButton.hasClass('active-color')){
				Arbiter.insertFeaturesIntoTable([ event.feature ], meta.featureType, meta.geomName, meta.srsName, true);
			}
		});

		newWFSLayer.events.register("featureselected", null, function(event) {
			console.log("Feature selected: ", event.feature);
			
			selectedFeature = event.feature;
			oldSelectedFID = event.feature.fid;
			
			if (!jqAttributeTab.is(':visible'))
				jqAttributeTab.toggle();
			
			if(!jqDeleteFeatureButton.is(':visible')){
				jqFindMeButton.removeClass('arbiter-map-tools-bottom');
				jqDeleteFeatureButton.toggle();
			}	
		});

		newWFSLayer.events.register("featureunselected", null, function(event) {
			console.log("Feature unselected: ", event);
			selectedFeature = null;
			oldSelectedFID = null;
			
			Arbiter.CloseAttributesMenu();

			if (jqAttributeTab.is(':visible'))
				jqAttributeTab.toggle();
			
			if(jqDeleteFeatureButton.is(':visible')){
				jqFindMeButton.addClass('arbiter-map-tools-bottom');
				jqDeleteFeatureButton.toggle();
			}
		});
		
		var poiInBounds;
		newWFSLayer.events.register("beforefeatureadded", null, function(event) {
			//if in bounds
			if(Arbiter.currentProject.aoi.contains(event.feature.geometry.x, event.feature.geometry.y)) {
				poiInBounds = true;
				return true;
			}
				
			//if out of bounds
			console.log('Feature is out of bounds');
			poiInBounds = false;
			return false;
		});

		var addFeatureControl = new OpenLayers.Control.DrawFeature(newWFSLayer, OpenLayers.Handler.Point);
		addFeatureControl.events.register("featureadded", null, function(event) {
			if(poiInBounds == false) {
				return false;
			}
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
		$.mobile.changePage(_div /*, {transition: "pop"}*/);
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
