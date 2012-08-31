package lmn.dsi;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.net.URL;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAccessProtectedResource;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson.JacksonFactory;
import com.google.gdata.client.youtube.YouTubeService;
import com.google.gdata.data.media.MediaFileSource;
import com.google.gdata.data.media.mediarss.MediaCategory;
import com.google.gdata.data.media.mediarss.MediaDescription;
import com.google.gdata.data.media.mediarss.MediaKeywords;
import com.google.gdata.data.media.mediarss.MediaTitle;
import com.google.gdata.data.youtube.VideoEntry;
import com.google.gdata.data.youtube.YouTubeMediaGroup;
import com.google.gdata.data.youtube.YouTubeNamespace;
import com.google.gdata.util.AuthenticationException;
import com.google.gdata.util.ServiceException;
import com.sun.jersey.core.header.FormDataContentDisposition;
import com.sun.jersey.multipart.FormDataParam;

// POJO, no interface no extends

// The class registers its methods for the HTTP GET request using the @GET annotation. 
// Using the @Produces annotation, it defines that it can deliver several MIME types,
// text, XML and HTML. 

// The browser requests per default the HTML MIME type.

//Sets the path to base URL + /youtube
@Path("/youtube")
public class YouTube {
	static final String SERVICE_URL = "http://uploads.gdata.youtube.com/feeds/api/users/default/uploads";

	// Google OAuth 2.0 stuff
	static final String GOOGLE_CLIENT_ID = "693645881354-fqckfqe5hg6mog9fplio2d42sqlejcc5.apps.googleusercontent.com";
	static final String GOOGLE_CLIENT_SECRET = "wafp9ueoH47hv8uGBzaqMdcZ";
	static final String GOOGLE_REFRESH_TOKEN = "1/we65YMVNrqJ2u9kCAqybeCttZT4-nlO10f6-19-XDsY";
	static final String DEFAULT_USER = "default";
	static final String VIDEO_UPLOAD_FEED = "http://uploads.gdata.youtube.com/feeds/api/users/"
		      + DEFAULT_USER + "/uploads";
	static final String DEVELOPER_KEY = "AI39si7G31k2yNpOJWCQrZRB8jTkeEfpSIE2yyVf9Qorjij6vrQw4uf3l1T_9VKLbSdMxiXi2b7vtziFcPPxogo1OPlg3dZBzQ";
	
	HttpTransport httpTransport = new NetHttpTransport();
	JsonFactory jsonFactory = new JacksonFactory();

	GoogleAccessProtectedResource access = new GoogleAccessProtectedResource("", httpTransport, jsonFactory, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
			GOOGLE_REFRESH_TOKEN);
	
	@POST
	@Path("/upload")
	@Consumes(MediaType.MULTIPART_FORM_DATA)
	public Response uploadFile(@FormDataParam("file") InputStream uploadedInputStream,
								@FormDataParam("file") FormDataContentDisposition fileDetail,
								@FormDataParam("mimeType") String mimeType,
								@FormDataParam("name") String name){
		
		String uploadedFileLocation = "temp/" + fileDetail.getFileName();
		
		writeToFile(uploadedInputStream, uploadedFileLocation);
		
		//String output = "File uploaded to : " + System.getProperty("user.dir") + "/" + uploadedFileLocation;
		
		String output = uploadToYoutube(uploadedFileLocation, name, mimeType);
		
		return Response.status(200).entity(output).build();
	}
	
	private void writeToFile(InputStream uploadedInputStream, String uploadedFileLocation){
		try{
			OutputStream out = new FileOutputStream(new File(uploadedFileLocation));
			int read = 0;
			byte[] bytes = new byte[1024];
			
			out = new FileOutputStream(new File(uploadedFileLocation));
			while((read = uploadedInputStream.read(bytes)) != -1){
				out.write(bytes, 0, read);
			}
		} catch (IOException e){
			e.printStackTrace();
		}
	}
	
	private String uploadToYoutube(String uploadedFileLocation, String videoTitle, String mimeType){
		YouTubeService service = new YouTubeService(GOOGLE_CLIENT_ID, DEVELOPER_KEY);
		try {
			service.setUserCredentials("research.lmn@gmail.com", "lmnisgr8");
		} catch (AuthenticationException e1) {
			return "authentication exception";
		}
		
		File videoFile = new File(uploadedFileLocation);
		
		if(!videoFile.exists())
			return "Video does not exist";
		
		VideoEntry newEntry = new VideoEntry();
		YouTubeMediaGroup mg = newEntry.getOrCreateMediaGroup();
		
		mg.addCategory(new MediaCategory(YouTubeNamespace.CATEGORY_SCHEME, "Education"));
		mg.setTitle(new MediaTitle());
		mg.getTitle().setPlainTextContent(videoTitle);
		mg.setKeywords(new MediaKeywords());
		mg.getKeywords().addKeyword("disaster");
		mg.setDescription(new MediaDescription());
		mg.setPrivate(false);
		mg.getDescription().setPlainTextContent("from mobile disaster app");
		MediaFileSource ms = new MediaFileSource(videoFile, "video/quicktime");
		newEntry.setMediaSource(ms);
		
		try{
			try {
				VideoEntry insertedEntry = service.insert(new URL(VIDEO_UPLOAD_FEED), newEntry);
				videoFile.delete();
				String videoId = insertedEntry.getMediaGroup().getVideoId();
				return videoId;
			} catch (MalformedURLException e) {
				return "Malformed URL exception";
			} catch (IOException e) {
				return "IO exception";
			}
		} catch (ServiceException se){
			return "Sorry, your upload was invalid: \n" + se.getResponseBody();
		}
	}
}
