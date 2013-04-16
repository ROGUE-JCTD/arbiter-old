# Arbiter

Arbiter is a mobile app for geospatial data collection in both connected and disconnected environments.  It supports editing geometry for point features (add/modify/delete) and attributes for point, line, and polygon features.  It organizes collection into projects so you can have several different collection efforts saved on the device.  

Arbiter is meant to be flexible: no particular data schema is presumed.  It gets this information from the Web Feature Service (WFS).  If domains for the attributes are defined on the server, Arbiter will use that to populate the drop-down menus.  Updates are pushed through WFS-T (transaction).  Also, for the area of interest defined for the project, Arbiter will download map tiles from a Web Mapping Service (WMS).

## Supported Devices

 * Apple iPad (iOS versions 5 and 6)
 * Apple iPhone (iOS versions 5 and 6)
 * Android smart phones (operating systems 2.2, 2.3, 4.0, 4.1, and 4.2)

We've tested on iPad, iPhone, Nexus 7 tablets, and Galaxy S

## Arbiter Development Environment

### Cordova
Arbiter uses Cordova 2.4.0, which is included with this project.
If you would like more information on Cordova 2.4.0 you can head over to http://phonegap.com/ .

### Weinre
Weinre is an tool you can use in your web browser to debug Cordova applications.
To run, open the terminal and navigate to your Arbiter folder. Then enter this command:

java -jar weinre.jar --readTimeout 100 --boundHost Your.IP.Goes.Here

Open your favorite web browser and go to your IP address at port 8080 and follow the instructions.

## License

Arbiter has been released under the [MIT license] (http://mit-license.org)

Copyright (c) 2012-2013 [LMN Solutions, LLC.] (www.lmnsolutions.com) 

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

