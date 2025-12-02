import { Controller, All, Req, Res, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { ProxyService } from "./proxy.service";
import { ServicesConfig } from "../config/services.config";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ResponseBuilderService } from "../common/encryption.service";
import { v4 as uuidv4 } from "uuid";

@Controller()
export class ProxyController {
  constructor(
    private proxyService: ProxyService,
    private servicesConfig: ServicesConfig,
    private responseBuilder: ResponseBuilderService
  ) {}

  @All("/api/v1/*")
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async handleRequest(@Req() req: Request, @Res() res: Response) {
    const requestId = uuidv4();
    const path = req.path;

    const requiresAuth = this.servicesConfig.requiresAuth(path);

    let user = null;

    // Apply JWT guard conditionally
    if (requiresAuth) {
      const guard = new JwtAuthGuard();
      console.log("🔒 Authentication required for path:", path);
      console.log("📋 Authorization header:", req.headers.authorization);

      try {
        console.log("🔍 Attempting JWT validation...");

        // Create a proper execution context for the guard
        const context = {
          switchToHttp: () => ({
            getRequest: () => req,
            getResponse: () => res,
          }),
          getClass: () => ProxyController,
          getHandler: () => this.handleRequest,
        } as any;
        console.log("JWT guard context:", context);

        const canActivate = await guard.canActivate(context);
        console.log("JWT canActivate:", canActivate);

        if (canActivate) {
          // Extract user from request (set by passport after JWT validation)
          user = (req as any).user;
          console.log("✅ JWT validation successful. User:", user);
        }
      } catch (error) {
        console.error("❌ JWT validation failed:", error.message);
        console.error("Error details:", error);

        const errorResponse = this.responseBuilder
          .createBuilder(requestId)
          .status(HttpStatus.UNAUTHORIZED)
          .withMessage("Unauthorized")
          .withError("Authentication required", "UNAUTHORIZED")
          .withRequestContext({
            path: req.path,
            method: req.method,
          })
          .build();

        return res.status(HttpStatus.UNAUTHORIZED).json(errorResponse);
      }
    }

    try {
      // Prepare headers to forward
      const headersToForward = { ...req.headers };

      // Add user information to headers if authenticated
      if (user) {
        headersToForward["x-user-id"] = user.userId;
        headersToForward["x-user-email"] = user.email;
        headersToForward["x-user-username"] = user.username;
        headersToForward["x-user-role"] = user.role;
      }

      const result = await this.proxyService.forwardRequest(
        req.method,
        path,
        req.body,
        headersToForward
      );

      // Forward Set-Cookie headers to client
      if (result.headers && result.headers["set-cookie"]) {
        console.log("🍪 Forwarding Set-Cookie:", result.headers["set-cookie"]);
        res.setHeader("set-cookie", result.headers["set-cookie"]);
      }

      // Handle cookies for login/register
      const isLogin = path.includes("/auth/login");
      const isRegister = path.includes("/auth/register");

      console.log("🔍 Path:", path);
      console.log("🔍 isLogin:", isLogin, "isRegister:", isRegister);
      console.log("🔍 result.data:", JSON.stringify(result.data, null, 2));

      // Auth service returns: { status, message, data: { ...user, accessToken } }
      // So we need to check result.data.data.accessToken
      const authData = result.data?.data;

      if ((isLogin || isRegister) && authData?.accessToken) {
        console.log(
          "✅ Setting cookies with accessToken:",
          authData.accessToken.substring(0, 20) + "..."
        );

        // Set access token (httpOnly) - for stateless JWT auth
        res.cookie("accessToken", authData.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
          maxAge: 24 * 60 * 60 * 1000, // 24 hours (matches JWT expiry)
          domain:
            process.env.NODE_ENV === "production" ? "evently.com" : "localhost",
        });

        console.log("🍪 accessToken cookie set");

        // Set session cookie (non httpOnly) to persist UI state
        res.cookie(
          "session",
          JSON.stringify({
            userId: authData.id,
            email: authData.email,
            username: authData.username,
            role: authData.role,
          }),
          {
            httpOnly: false, // MUST be readable by frontend
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
            maxAge: 24 * 60 * 60 * 1000, // Match accessToken expiry
            domain:
              process.env.NODE_ENV === "production"
                ? "evently.com"
                : "localhost",
          }
        );

        console.log("🍪 session cookie set");

        // Don't send accessToken in response body (it's in cookie now)
        delete authData.accessToken;
      } else {
        console.log("❌ Cookie condition not met");
        console.log("   - authData:", authData);
        console.log("   - accessToken exists:", !!authData?.accessToken);
      }

      // Check if this is a logout endpoint and clear cookie
      if (path.includes("/auth/logout")) {
        res.clearCookie("accessToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
          domain:
            process.env.NODE_ENV === "production" ? "evently.com" : "localhost",
        });

        res.clearCookie("session", {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
          domain:
            process.env.NODE_ENV === "production" ? "evently.com" : "localhost",
        });
      }

      // Build successful response
      const responseMessage = result.message || result.data?.message;

      const successResponse = this.responseBuilder
        .createBuilder(requestId)
        .status(result.status)
        .withMessage(responseMessage)
        .withData(result.data)
        .withMeta({
          apiVersion: "v1",
        })
        .withRequestContext({
          path: req.path,
          method: req.method,
        })
        .build();

      return res.status(result.status || HttpStatus.OK).json(successResponse);
    } catch (error) {
      const errorResponse = this.responseBuilder
        .createBuilder(requestId)
        .status(error.status || HttpStatus.BAD_GATEWAY)
        .withMessage(error.message || "Service unavailable")
        .withError(
          error.message || "Service unavailable",
          error.code || "SERVICE_ERROR",
          error.details
        )
        .withRequestContext({
          path: req.path,
          method: req.method,
        })
        .build();

      return res
        .status(error.status || HttpStatus.BAD_GATEWAY)
        .json(errorResponse);
    }
  }
}
