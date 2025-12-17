import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import prisma from '../prisma';
import { ERROR_CODES } from '../constants/errorCodes';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token;

    // 1. Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Check Cookies
    else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.cookies.session) {
      token = req.cookies.session;
    }

    if (!token) {
      return next(new AppError(ERROR_CODES.NOT_AUTHENTICATED));
    }

    // 3. Verify Token
    const decoded: any = jwt.verify(token, config.jwtAccessSecret);

    // 4. Check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        gender: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!currentUser) {
      return next(new AppError(ERROR_CODES.USER_NOT_FOUND));
    }

    // 5. Grant Access
    req.user = currentUser;
    next();
  } catch (error) {
    next(new AppError(ERROR_CODES.INVALID_REFRESH_TOKEN));
  }
};
