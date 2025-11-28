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

    // Apply JWT guard conditionally
    if (requiresAuth) {
      const guard = new JwtAuthGuard();
      try {
        await guard.canActivate({
          switchToHttp: () => ({
            getRequest: () => req,
          }),
        } as any);
      } catch (error) {
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
      const result = await this.proxyService.forwardRequest(
        req.method,
        path,
        req.body,
        req.headers
      );

      // Check if this is a login or register endpoint and set cookie
      const isLogin = path.includes("/auth/login");
      const isRegister = path.includes("/auth/register");
      const isRefresh = path.includes("/auth/refresh");

      if ((isLogin || isRegister || isRefresh) && result.data?.refreshToken) {
        res.cookie("refreshToken", result.data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // only HTTPS in prod, use false in localhost
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        delete result.data.refreshToken; // optional: avoid exposing token
      }

      // Check if this is a logout endpoint and clear cookie
      if (path.includes("/auth/logout")) {
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      }

      // Build successful response
      const successResponse = this.responseBuilder
        .createBuilder(requestId)
        .status(result.status)
        .withMessage(result.message)
        .withData(result.data)
        .withMeta({
          apiVersion: "v1",
        })
        .withRequestContext({
          path: req.path,
          method: req.method,
        })
        .build();

      return res.status(HttpStatus.OK).json(successResponse);
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
