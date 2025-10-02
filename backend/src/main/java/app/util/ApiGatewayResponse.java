package app.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

public class ApiGatewayResponse {
  private static final ObjectMapper MAPPER = new ObjectMapper();

  public static Map<String, Object> json(int status, Object body) {
    try {
      Map<String, Object> resp = new HashMap<>();
      resp.put("statusCode", status);
      resp.put("headers", Map.of(
        "Content-Type", "application/json",
        "Access-Control-Allow-Origin", "*",
        "Access-Control-Allow-Headers", "Authorization,Content-Type",
        "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS"
      ));
      resp.put("body", MAPPER.writeValueAsString(body));
      return resp;
    } catch (Exception e) { throw new RuntimeException(e); }
  }
}