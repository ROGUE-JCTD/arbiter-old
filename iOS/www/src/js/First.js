/* ============================ *
 *   	    Catch Script Errors
 * ============================ */

function windowError(message, url, line) {
    
    var msg = 	"A script error has been detected. Please re-start your session as this error might cause more issues. " +
				"Taking note of steps that led to this error can help us resolve this issue." +
				"\n\nMessage: " + (message? message: "") + "\nUrl: " + (url? url: "") + "\nLine: " + (line? line: "");

    console.log(msg);
    alert(msg);
}
window.onerror=windowError;
