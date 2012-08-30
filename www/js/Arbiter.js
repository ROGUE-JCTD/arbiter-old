// initialize map when page ready
var map;

var Arbiter = {
    Initialize: function() {
		console.log("What will you have your Arbiter do?"); //http://www.youtube.com/watch?v=nhcHoUj4GlQ
		
		// create map
		map = new OpenLayers.Map({
			div: "map",
			theme: null,
			controls: [
				new OpenLayers.Control.Attribution(),
				new OpenLayers.Control.TouchNavigation({
					dragPanOptions: {
						enableKinetic: true
					}
				}),
				new OpenLayers.Control.Zoom()
			],
			layers: [
				new OpenLayers.Layer.OSM("OpenStreetMap", null, {
					transitionEffect: 'resize'
				})
			],
			center: new OpenLayers.LonLat(742000, 5861000),
			zoom: 3
		});
								 
		console.log("end");
    }
};