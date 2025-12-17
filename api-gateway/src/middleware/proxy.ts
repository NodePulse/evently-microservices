import {
  createProxyMiddleware,
  Options,
  responseInterceptor,
} from "http-proxy-middleware";
import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { responseBuilder } from "../utils/responseBuilder";
import { v4 as uuidv4 } from "uuid";

const createProxy = (target: string, pathRewrite?: Record<string, string>) => {
  const options: Options = {
    target,
    changeOrigin: true,
    pathRewrite,
    selfHandleResponse: true,
    onProxyReq: (proxyReq, req, res) => {
      // Add gateway secret
      proxyReq.setHeader("x-gateway-secret", config.gatewaySecret);

      // Forward user information if authenticated
      const expressReq = req as any;
      if (expressReq.user) {
        proxyReq.setHeader("x-user-id", expressReq.user.userId);
        proxyReq.setHeader("x-user-email", expressReq.user.email);
        proxyReq.setHeader("x-user-username", expressReq.user.username);
        proxyReq.setHeader("x-user-role", expressReq.user.role);
      }

      // Explicitly set Host header to match target
      const targetUrl = new URL(target);
      proxyReq.setHeader("host", targetUrl.host);
      console.log(
        "\x1b[36m%s\x1b[0m",
        `[${(req as any).id}] Proxy Request Body:`,
        req.body
      );

      // Restream parsed body if present (needed because of express.json() in app.ts)
      if (expressReq.body && Object.keys(expressReq.body).length > 0) {
        const bodyData = JSON.stringify(expressReq.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: responseInterceptor(
      async (responseBuffer, proxyRes, req, res) => {
        const requestId = uuidv4();
        const statusCode = proxyRes.statusCode || 200;

        try {
          const responseString = responseBuffer.toString("utf8");
          let downstreamData;
          try {
            downstreamData = JSON.parse(responseString);
          } catch (e) {
            downstreamData = responseString;
          }

          console.log("\x1b[32m%s\x1b[0m", "Proxy Response:", downstreamData);

          // Debug: Log user agent for encryption detection
          const userAgent = (req as any).headers?.["user-agent"] || "unknown";
          console.log("\x1b[33m%s\x1b[0m", `User-Agent: ${userAgent}`);

          const builder = responseBuilder
            .createBuilder(requestId, (req as Request).startTime, req)
            .status(statusCode)
            .withRequestContext({
              path: (req as Request).path,
              method: req.method,
            });

          if (downstreamData && typeof downstreamData === "object") {
            // Map downstream { status, message, data } to ResponseBuilder
            if (downstreamData.message) {
              builder.withMessage(downstreamData.message);
            }

            // If downstream has 'data' field, use it. Otherwise use the whole object.
            // But be careful not to nest if it's already the structure we want?
            // The downstream service returns { status, message, data: ... }
            // We want to put that 'data' into our 'data'.
            if (downstreamData.data !== undefined) {
              builder.withData(downstreamData.data);
            } else {
              // Fallback: if no 'data' field, maybe the whole object is data
              // But exclude status/message if they were consumed
              const { status, message, ...rest } = downstreamData;
              if (Object.keys(rest).length > 0) {
                builder.withData(rest);
              }
            }

            if (statusCode >= 400) {
              builder.withError(
                downstreamData.message || "Error",
                downstreamData.code,
                downstreamData.details
              );
            }
          } else {
            builder.withData(downstreamData);
          }

          const apiResponse = builder.build();
          return JSON.stringify(apiResponse);
        } catch (error) {
          console.error("Response interception error:", error);
          return responseBuffer;
        }
      }
    ),
    onError: (err, req, res) => {
      console.error("Proxy Error:", err);
      (res as Response).status(502).json({
        status: 502,
        message: "Bad Gateway",
        error: "Service unavailable",
      });
    },
  };
  return createProxyMiddleware(options);
};

export const setupProxies = (app: any) => {
  // User Service
  // /api/v1/user/auth -> /auth
  app.use(
    "/api/v1/user/auth",
    createProxy(config.services.user.url, {
      "^/api/v1/user/auth": "/auth",
    })
  );

  // /api/v1/user/profile -> /profile
  app.use(
    "/api/v1/user/profile",
    createProxy(config.services.user.url, {
      "^/api/v1/user/profile": "/profile",
    })
  );

  // Event Service
  // /api/v1/events -> /
  app.use(
    "/api/v1/events",
    createProxy(config.services.event.url, {
      "^/api/v1/events": "/",
    })
  );

  // Ticket Service
  // /api/v1/ticket/tickets -> /tickets (assuming standard)
  app.use(
    "/api/v1/ticket/tickets",
    createProxy(config.services.ticket.url, {
      "^/api/v1/ticket/tickets": "/tickets",
    })
  );

  // Payment Service
  // /api/v1/payment/payments -> /payments (assuming standard)
  app.use(
    "/api/v1/payment/payments",
    createProxy(config.services.payment.url, {
      "^/api/v1/payment/payments": "/payments",
    })
  );
};
