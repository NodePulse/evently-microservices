import { Request, Response, NextFunction } from "express";

// Extend Express Request type to include user property
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

/**
 * Middleware to extract authenticated user information from request headers
 * Headers are set by the API Gateway after JWT validation
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.headers["x-user-id"] as string;
  const userEmail = req.headers["x-user-email"] as string;
  const username = req.headers["x-user-username"] as string;
  const userRole = req.headers["x-user-role"] as string;

  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: "Unauthorized: Authentication required",
      error: "No user information provided",
    });
  }

  // Attach user info to request for use in controllers
  req.user = {
    userId,
    email: userEmail,
    username,
    role: userRole,
  };

  next();
};

/**
 * Optional auth middleware - extracts user if present but doesn't require it
 * Useful for routes that behave differently for authenticated users but are also public
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.headers["x-user-id"] as string;
  const userEmail = req.headers["x-user-email"] as string;
  const username = req.headers["x-user-username"] as string;
  const userRole = req.headers["x-user-role"] as string;

  if (userId) {
    req.user = {
      userId,
      email: userEmail,
      username,
      role: userRole,
    };
  }

  next();
};
