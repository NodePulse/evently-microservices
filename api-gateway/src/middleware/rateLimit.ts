import rateLimit from "express-rate-limit";

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
  handler: (req, res, next) => {
    console.log("Rate limit exceeded");
    res.status(429).json({
      status: 429,
      message: "Too many login attempts, please try again after 15 minutes",
    });
  },
});
