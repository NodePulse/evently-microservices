import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        username: string;
        role: string;
      };
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

/**
 * Middleware to extract JWT from cookies and validate it
 * Adds user information to request headers for downstream services
 */
export const extractUserFromJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from cookie
    const token = req.cookies?.accessToken;

    if (!token) {
      // No token, continue without user info (some routes may be public)
      return next();
    }

    // Verify and decode JWT
    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_ACCESS_SECRET not configured");
      return next();
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Attach user to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Invalid token, continue without user info
    console.log("JWT verification failed:", error.message);
    next();
  }
};
