import { Request, Response, NextFunction } from "express";

/**
 * Middleware to validate that requests are coming from the API Gateway
 * Checks for the x-gateway-secret header
 */
export const validateGatewayRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const gatewaySecret = req.headers["x-gateway-secret"];
  const expectedSecret = process.env.GATEWAY_SECRET || "secure-gateway-secret";

  // Allow health check endpoint to bypass gateway validation
  if (req.path === "/health") {
    return next();
  }

  if (!gatewaySecret) {
    return res.status(403).json({
      status: 403,
      message: "Forbidden: Direct access not allowed",
      error: "Missing gateway authentication",
    });
  }

  if (gatewaySecret !== expectedSecret) {
    return res.status(403).json({
      status: 403,
      message: "Forbidden: Invalid gateway credentials",
      error: "Invalid gateway secret",
    });
  }

  // Request is valid, proceed
  next();
};
