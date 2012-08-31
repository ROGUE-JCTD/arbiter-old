package lmn.dsi;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URLEncoder;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAccessProtectedResource;
import com.google.api.client.http.ByteArrayContent;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpHeaders;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestFactory;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson.JacksonFactory;
import com.google.api.client.util.Strings;

// POJO, no interface no extends

// The class registers its methods for the HTTP GET request using the @GET annotation. 
// Using the @Produces annotation, it defines that it can deliver several MIME types,
// text, XML and HTML. 

// The browser requests per default the HTML MIME type.

//Sets the path to base URL + /fusion
@Path("/fusion")
public class Fusion {

	static final String SERVICE_URL = "https://www.google.com/fusiontables/api/query";

	// Google OAuth 2.0 stuff
	static final String GOOGLE_CLIENT_ID = "693645881354-fqckfqe5hg6mog9fplio2d42sqlejcc5.apps.googleusercontent.com";
	static final String GOOGLE_CLIENT_SECRET = "wafp9ueoH47hv8uGBzaqMdcZ";
	static final String GOOGLE_REFRESH_TOKEN = "1/we65YMVNrqJ2u9kCAqybeCttZT4-nlO10f6-19-XDsY";

	// Fusion Table IDs
	static final String STATUSREF = "1IhAYlY58q5VxSSzGQdd7PyGpKSf0fhjm7nSetWQ";
	static final String LOCATIONS = "1G4GCjQ21U-feTOoGcfWV9ITk4khKZECbVCVWS2E";

	HttpTransport httpTransport = new NetHttpTransport();
	JsonFactory jsonFactory = new JacksonFactory();

	GoogleAccessProtectedResource access = new GoogleAccessProtectedResource("", httpTransport, jsonFactory, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
			GOOGLE_REFRESH_TOKEN);

	String doGet(String sql) {
		try {
			GenericUrl url = new GenericUrl(SERVICE_URL + "?sql=" + URLEncoder.encode(sql, "UTF-8"));

			HttpRequestFactory rf = httpTransport.createRequestFactory(access);
			HttpRequest request = rf.buildGetRequest(url);

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType("application/x-www-form-urlencoded");
			request.setHeaders(headers);

			HttpResponse rows = request.execute();
			BufferedReader output = new BufferedReader(new InputStreamReader(rows.getContent()));
			String response = "";
			for (String line = output.readLine(); line != null; line = output.readLine()) {
				response += line;
				response += "\n";
			}

			return response;
		} catch (IOException e) {
			return e.getMessage();
		}
	}

	String doPost(String sql) {
		try {
			GenericUrl url = new GenericUrl(SERVICE_URL);
			String requestBody = sql;

			HttpRequestFactory rf = httpTransport.createRequestFactory(access);
			HttpRequest request = rf.buildPostRequest(url, new ByteArrayContent(null, Strings.toBytesUtf8(requestBody)));

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType("application/x-www-form-urlencoded");
			request.setHeaders(headers);

			HttpResponse rows = request.execute();
			BufferedReader output = new BufferedReader(new InputStreamReader(rows.getContent()));
			String response = "";
			for (String line = output.readLine(); line != null; line = output.readLine()) {
				response += line;
				response += "\n";
			}

			return response;
		} catch (IOException e) {
			return e.getMessage();
		}
	}

	// This method is called if TEXT_PLAIN is request
	@GET
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	public String fusionGet(@QueryParam("sql") String sql) {
		return doGet(sql);
	}

	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	public String fusionPost(String sql) {
		return doPost(sql);
	}
}
