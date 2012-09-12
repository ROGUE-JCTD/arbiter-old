package lmn.dsi;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

@Path("/postgis")
public class PostGIS {
	
	static Connection con = null;
	static Statement st = null;
	static ResultSet rs = null;
	static String url = "jdbc:postgresql://localhost:54321/Arbiter";
	static String user = "postgres";
	static String password = "postgres";

	static String doGet(String sql) {
		String returnJson = "";
		System.out.println("-------- PostgreSQL "
				+ "JDBC Connection Testing ------------");
 
		try {
 
			Class.forName("org.postgresql.Driver");
 
		} catch (ClassNotFoundException e) {
 
			System.out.println("Where is your PostgreSQL JDBC Driver? "
					+ "Include in your library path!");
			e.printStackTrace();
		}
 
		System.out.println("PostgreSQL JDBC Driver Registered!");
 
		Connection connection = null;
 
		try {
 
			connection = DriverManager.getConnection(
					url, user, password);
 
		} catch (SQLException e) {
 
			System.out.println("Connection Failed! Check output console");
			e.printStackTrace();
		}
 
		if (connection != null) {
			System.out.println("You made it, take control your database now!");
		} else {
			System.out.println("Failed to make connection!");
		}
		
		try {
			st = connection.createStatement();
			 rs = st.executeQuery(sql);
			 ResultSetMetaData rsmd = rs.getMetaData();
			 int NumOfCol = rsmd.getColumnCount();
			 
			 while(rs.next()) {
				 
				 if(!rs.isFirst()) {
					 returnJson += "},\n";
				 }
				 
				 returnJson += "Feature: {\n";
				 
				 for(int i = 1; i <= NumOfCol; i++) {
					 returnJson += rsmd.getColumnName(i) + ": " + rs.getString(i);
					 
					if(i == NumOfCol) {
						returnJson += "\n";
					}
					else {
						returnJson += ",\n";
					}
				 }
		     }
			 
			 if(NumOfCol > 0) {
				 returnJson += "}\n";
			 }
			 
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		return returnJson;
	}
	
	String doPost(String sql) {
		return "temp";
	}
	
	// This method is called if TEXT_PLAIN is request
	@GET
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	public String postgisGet(@QueryParam("sql") String sql) {
		return doGet(sql);
	}

	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	public String postgisPost(String sql) {
		return doPost(sql);
	}
	
	public static void main(String[] args) {
		System.out.print(doGet("SELECT * FROM \"Feature\""));
	}
}