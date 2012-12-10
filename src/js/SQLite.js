var application	= null;

var SQLite = {
	
	//=======
	// SQLite
	//=======
Initialize: function(_app) {
    if(_app) {
        application = _app;
    }
},
	
testSQLite: function() {
    console.log("---- SQLite.test");
    var db = window.sqlitePlugin.openDatabase("ArbiterSQLiteDB", "1.0", "Arbiter", 200000);
    
	db.transaction(function(tx) {
		tx.executeSql('DROP TABLE IF EXISTS test_table');
		tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');
		tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
			console.log("insertId: " + res.insertId + " -- probably 1");
			console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
			db.transaction(function(tx) {
				tx.executeSql("select count(id) as cnt from test_table;", [], function(tx, res) {
					console.log("res.rows.length: " + res.rows.length + " -- should be 1");
					console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
					alert("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
				});
			});
		}, function(e) {
			console.log("====>> ERROR: " + e.message);
		});
	});
},
	
dumpFiles: function() {
	console.log("---- SQLite.dumpFiles");
	var myFileSystem = null;
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
		function(fileSystem){
			try {
				 console.log("---- fileSystem.root: " + fileSystem.root.name);
				 var directoryReader = fileSystem.root.createReader();
				 directoryReader.readEntries(
					function(entries) {
						 var i;
						 for (i=0; i<entries.length; i++) {
							 if (entries[i].isDirectory) {
								 console.log("--{ Dir: " + entries[i].name, "path: " + entries[i].fullPath);
							 } else {
								 console.log("--{ File: " + entries[i].name, "path: " + entries[i].fullPath);
							 }
						 }
					},
					function(){
						console.log("====>> failDirectoryReader");
					}
				);
			} catch (e) {
				console.log("====>> dumpFiles.exception: "+ e);
			}
		}, 
		function(error) {
			console.log("====>> failed to get filesystem. error: " + error.code);
		}
	);	
}
    
};