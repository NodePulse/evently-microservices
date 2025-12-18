import rateLimit from "express-rate-limit";
import { responseBuilder } from "../utils/responseBuilder";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    status: 429,
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Only count failed requests (status >= 400)
  keyGenerator: (req) => {
    console.log(
      `[${(req as any).id}] Rate Limit Request from user: ${req?.body?.email}`
    );
    return req?.body?.email || "unknown";
  },
  handler: (req: any, res, next) => {
    console.log("Login rate limit exceeded");
    const response = responseBuilder
      .createBuilder(req.id, req.startTime, req)
      .status(429)
      .withMessage("Too many login attempts, please try again after 15 minutes")
      .withError(
        "Too many login attempts, please try again after 15 minutes",
        "LOGIN_RATE_LIMIT_EXCEEDED"
      )
      .withRequestContext({
        path: req.path,
        method: req.method,
      })
      .build();

    res.status(429).json(response);
  },
});

export const otpRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Limit each IP to 3 OTP requests per windowMs
  message: {
    status: 429,
    message:
      "Too many OTP requests. Only 3 OTPs allowed per 24 hours. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    console.log(
      `[${(req as any).id}] OTP Rate Limit Request from user: ${
        req?.body?.email
      }`
    );
    return req?.body?.email || "unknown";
  },
  handler: (req: any, res, next) => {
    console.log("OTP rate limit exceeded");
    const response = responseBuilder
      .createBuilder(req.id, req.startTime, req)
      .status(429)
      .withMessage(
        "Too many OTP requests. Only 3 OTPs allowed per 24 hours. Please try again later."
      )
      .withError(
        "Too many OTP requests. Only 3 OTPs allowed per 24 hours. Please try again later.",
        "OTP_RATE_LIMIT_EXCEEDED"
      )
      .withRequestContext({
        path: req.path,
        method: req.method,
      })
      .build();

    res.status(429).json(response);
  },
});
