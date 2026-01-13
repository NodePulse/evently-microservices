import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from '../prisma';
import { config } from '../config';
import { getImageUrl } from '../utils/commonFunction';
import { AppError } from '../utils/AppError';
import { ERROR_CODES } from '../constants/errorCodes';
import { logger } from '../utils/logger';
import { AppResponse } from '../utils/AppResponse';
import { rabbitMQService } from './rabbitmq.service';

export const AuthService = {
  getTransporter: () => {
    if (!config.emailUser || !config.emailPass) {
      return null;
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.emailUser,
        pass: config.emailPass,
      },
    });
  },

  getAccessToken: (payload: AccessTokenPayload) => {
    return jwt.sign(payload, config.jwtAccessSecret, { expiresIn: '24h' });
  },

  sendEmail: (to: string, subject: string, text: string) => {
    try {
      const transporter = AuthService.getTransporter();
      if (transporter && config.emailUser) {
        transporter.sendMail({
          from: config.emailUser,
          to,
          subject,
          text,
        });
      }
    } catch (error) {
      logger.error(`Send email error: ${error}`);
    }
  },

  register: async (requestId: string, registerDto: any) => {
    try {
      const { email, username, password, gender, name, confirmPassword } =
        registerDto;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new AppError(ERROR_CODES.USER_EXISTS);
      }

      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername) {
        throw new AppError(ERROR_CODES.USERNAME_EXISTS);
      }

      if (password !== confirmPassword) {
        throw new AppError(ERROR_CODES.PASSWORD_MISMATCH);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const imageUrl = getImageUrl(gender, username);

      const newUser = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash: hashedPassword,
          image: imageUrl,
          role: 'USER',
          gender,
          name,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          gender: true,
          role: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const payload: AccessTokenPayload = {
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      };

      const accessToken = AuthService.getAccessToken(payload);

      rabbitMQService.publish('user-creation', {
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
        gender: newUser.gender,
        image: newUser.image,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      });

      logger.info(`User registered successfully: ${newUser.id}`);
      return new AppResponse(201, 'Registration successful', {
        ...newUser,
        accessToken,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Registration error: ${error}`);
      throw new AppError(ERROR_CODES.REGISTRATION_ERROR);
    }
  },

  login: async (requestId: string, loginDto: any) => {
    try {
      const { email, password } = loginDto;

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          gender: true,
          image: true,
          role: true,
          passwordHash: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });

      if (!user || !user.passwordHash) {
        throw new AppError(ERROR_CODES.INVALID_CREDENTIALS);
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new AppError(ERROR_CODES.INVALID_CREDENTIALS);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const payload: AccessTokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      };

      const accessToken = AuthService.getAccessToken(payload);

      const responseData = {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        gender: user.gender,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        accessToken,
      };

      logger.info(`User logged in successfully: ${user.id}`);
      return new AppResponse(200, 'Login successful', responseData);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Login error: ${error}`);
      throw new AppError(ERROR_CODES.LOGIN_ERROR);
    }
  },

  logout: async (requestId: string, headers: any) => {
    try {
      logger.info(`User logged out (stateless): ${headers?.userId}`);
      return new AppResponse(200, 'Logged out successfully');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Logout error: ${error}`);
      throw new AppError(ERROR_CODES.LOGOUT_ERROR);
    }
  },

  changePassword: async (
    requestId: string,
    changePasswordDto: any,
    headers: any,
  ) => {
    try {
      const userId = headers?.userId || headers?.['x-user-id'];
      if (!userId) {
        throw new AppError(ERROR_CODES.NOT_AUTHENTICATED);
      }

      const { oldPassword, newPassword, confirmPassword } = changePasswordDto;

      if (newPassword !== confirmPassword) {
        throw new AppError(ERROR_CODES.PASSWORD_MISMATCH);
      }

      if (oldPassword === newPassword) {
        throw new AppError(ERROR_CODES.PASSWORD_SAME);
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!dbUser) {
        throw new AppError(ERROR_CODES.USER_NOT_FOUND);
      }

      // case handled
      if (!dbUser.passwordHash) {
        throw new AppError(ERROR_CODES.INVALID_OLD_PASSWORD);
      }

      const isMatch = await bcrypt.compare(oldPassword, dbUser.passwordHash);
      if (!isMatch) {
        throw new AppError(ERROR_CODES.INVALID_OLD_PASSWORD);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });

      return new AppResponse(200, 'Password changed successfully');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Change password error: ${error}`);
      throw new AppError(ERROR_CODES.CHANGE_PASSWORD_ERROR);
    }
  },

  forgotPassword: async (requestId: string, forgotPasswordDto: any) => {
    try {
      const { email } = forgotPasswordDto;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return new AppResponse(200, 'OTP sent successfully');
      }

      const otp =
        config.nodeEnv === 'development'
          ? '111111'
          : Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOTP = await bcrypt.hash(otp, 10);

      const resetSession = await prisma.passwordReset.create({
        data: {
          userId: user.id,
          otpHash: hashedOTP,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      AuthService.sendEmail(
        user.email,
        'Password Reset OTP',
        `Your OTP is ${otp}. It expires in 1 minute.`,
      );

      return new AppResponse(200, 'OTP sent successfully', {
        resetSessionId: resetSession.id,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Forgot password error: ${error}`);
      throw new AppError(ERROR_CODES.OTP_SEND_ERROR);
    }
  },

  verifyOTP: async (requestId: string, verifyOtpDto: any) => {
    try {
      const { resetSessionId, otp } = verifyOtpDto;

      const resetSession = await prisma.passwordReset.findUnique({
        where: { id: resetSessionId },
      });

      if (
        !resetSession ||
        resetSession.expiresAt < new Date() ||
        resetSession.otpUsedAt
      ) {
        throw new AppError(ERROR_CODES.EXPIRED_OTP);
      }

      const isOtpValid = await bcrypt.compare(otp, resetSession.otpHash);
      if (!isOtpValid) {
        throw new AppError(ERROR_CODES.INVALID_OTP);
      }

      await prisma.passwordReset.update({
        where: { id: resetSession.id },
        data: { otpUsedAt: new Date() },
      });

      const resetToken = jwt.sign(
        {
          userId: resetSession.userId,
          purpose: 'password_reset',
          sessionId: resetSession.id,
        },
        config.jwtResetSecret,
        {
          expiresIn: '5m',
        },
      );

      return new AppResponse(200, 'OTP verified successfully', {
        resetToken,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Verify OTP error: ${error}`);
      throw new AppError(ERROR_CODES.OTP_VERIFY_ERROR);
    }
  },

  changeForgotPassword: async (
    requestId: string,
    changeForgotPasswordDto: any,
  ) => {
    try {
      const { resetToken, newPassword, confirmPassword } =
        changeForgotPasswordDto;

      if (newPassword !== confirmPassword) {
        throw new AppError(ERROR_CODES.PASSWORD_MISMATCH);
      }

      const payload: JwtPayload = jwt.verify(
        resetToken,
        config.jwtResetSecret,
      ) as JwtPayload;
      if (!payload) {
        throw new AppError(ERROR_CODES.INVALID_TOKEN);
      }

      if (payload.purpose !== 'password_reset') {
        throw new AppError(ERROR_CODES.INVALID_TOKEN);
      }

      const resetSession = await prisma.passwordReset.findUnique({
        where: { id: payload.sessionId },
      });

      if (!resetSession || resetSession.tokenUsedAt) {
        throw new AppError(ERROR_CODES.INVALID_TOKEN);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.$transaction([
        prisma.passwordReset.update({
          where: { id: resetSession.id },
          data: { tokenUsedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: payload.userId },
          data: { passwordHash: hashedPassword },
        }),
      ]);

      return new AppResponse(200, 'Password changed successfully');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Change forgot password error: ${error}`);
      throw new AppError(ERROR_CODES.CHANGE_PASSWORD_ERROR);
    }
  },
};
