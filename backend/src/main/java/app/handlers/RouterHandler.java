package app.handlers;

import app.di.DaggerServiceComponent;
import app.di.ServiceComponent;
import app.service.ItemService;
import app.util.ApiGatewayResponse;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;

import java.util.*;

public class RouterHandler implements RequestHandler<APIGatewayProxyRequestEvent, Map<String, Object>> {
  private final ServiceComponent component;
  private final ItemService items;

  public RouterHandler() {
    this.component = DaggerServiceComponent.create();
    this.items = component.itemService();
  }

  @Override
  public Map<String, Object> handleRequest(APIGatewayProxyRequestEvent req, Context ctx) {
    try {
      String route = Optional.ofNullable(req.getPath()).orElse("");
      String method = Optional.ofNullable(req.getHttpMethod()).orElse("GET");

      String userId = Optional.ofNullable(req.getRequestContext())
        .map(c -> c.getAuthorizer())
        .map(a -> (Map<String, Object>) a.get("jwt"))
        .map(jwt -> (Map<String, Object>) jwt.get("claims"))
        .map(claims -> (String) claims.get("sub"))
        .orElse("anonymous");

      if (route.startsWith("/v1/items") && !"anonymous".equals(userId)) {
        if (method.equals("POST")) {
          String body = Optional.ofNullable(req.getBody()).orElse("");
          String v = body.replaceAll(".*\"value\":\"(.*?)\".*", "$1");
          if (v.isEmpty() || v.equals(body)) {
            return ApiGatewayResponse.json(400, Map.of("error", "Invalid body; expected {\"value\":\"...\"}"));
          }
          return ApiGatewayResponse.json(201, items.create(userId, v));
        }
        if (method.equals("GET") && route.equals("/v1/items")) {
          return ApiGatewayResponse.json(200, Map.of("items", items.list(userId)));
        }
        if (method.equals("GET")) {
          String id = route.substring("/v1/items/".length());
          return items.get(userId, id)
            .<Map<String, Object>>map(it -> ApiGatewayResponse.json(200, it))
            .orElseGet(() -> ApiGatewayResponse.json(404, Map.of("error", "Not found")));
        }
        if (method.equals("DELETE")) {
          String id = route.substring("/v1/items/".length());
          items.delete(userId, id);
          return ApiGatewayResponse.json(204, Map.of());
        }
      } else if (route.equals("/v1/me")) {
        return ApiGatewayResponse.json(200, Map.of("userId", userId));
      }

      return ApiGatewayResponse.json(404, Map.of("error", "Route not found"));
    } catch (Exception e) {
      return ApiGatewayResponse.json(500, Map.of("error", e.getMessage()));
    }
  }
}