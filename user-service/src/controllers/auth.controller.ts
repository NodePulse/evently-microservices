import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { v4 as uuidv4 } from 'uuid';

import { config } from '../config';

export const AuthController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const result = await AuthService.register(requestId, req.body);

    if ((result.status === 200 || result.status === 201) && result.data) {
      const { accessToken } = result.data;
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
      // Also set session cookie if frontend expects it (based on previous gateway logic)
      res.cookie(
        'session',
        JSON.stringify({
          userId: result.data.id,
          email: result.data.email,
          username: result.data.username,
          role: result.data.role,
        }),
        {
          httpOnly: false, // MUST be readable by frontend
          secure: config.nodeEnv === 'production',
          sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        },
      );
    }

    res.status(result.status).json(result);
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const result = await AuthService.login(requestId, req.body);

    if (result.status === 200 && result.data) {
      const { accessToken } = result.data;
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.cookie(
        'session',
        JSON.stringify({
          userId: result.data.id,
          email: result.data.email,
          username: result.data.username,
          role: result.data.role,
        }),
        {
          httpOnly: false, // MUST be readable by frontend
          secure: config.nodeEnv === 'production',
          sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        },
      );
    }

    res.status(result.status).json(result);
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const result = await AuthService.logout(requestId, req.headers);

    res.clearCookie('accessToken');
    res.clearCookie('session');

    res.status(result.status).json(result);
  }),

  changePassword: catchAsync(async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const result = await AuthService.changePassword(
      requestId,
      req.body,
      req.headers,
    );
    res.status(result.status).json(result);
  }),

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const result = await AuthService.forgotPassword(requestId, req.body);
    res.status(result.status).json(result);
  }),

  verifyOTP: catchAsync(async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const result = await AuthService.verifyOTP(requestId, req.body);
    res.status(result.status).json(result);
  }),

  changeForgotPassword: catchAsync(async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const result = await AuthService.changeForgotPassword(requestId, req.body);
    res.status(result.status).json(result);
  }),
};
