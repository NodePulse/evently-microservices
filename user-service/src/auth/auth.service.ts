import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { env } from '../config/env';
import { ERROR_CODES } from '../constants/errorCodes';
import { getImageUrl } from '../utils/commonFunction';
import { eventPublisher } from '../services/eventPublisher';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangeForgotPasswordDto } from './dto/change-forgot-password.dto';
import { JwtPayload } from 'jsonwebtoken';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private getTransporter() {
    if (!env.EMAIL_USER || !env.EMAIL_PASS) {
      return null;
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
  }

  private async getTokens(payload: JwtPayload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: env.JWT_ACCESS_SECRET, // add to your env
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: env.JWT_REFRESH_SECRET, // add to your env
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  // 👉 Hash + store refresh token
  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  // 👉 Clear refresh token on logout
  private async clearRefreshToken(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
  }

  private async verifyOtpHelper(email: string, otp: string) {
    const storedOtp = await this.prisma.otp.findFirst({
      where: { email, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
    });

    if (!storedOtp) {
      throw new BadRequestException({
        message: 'OTP expired or not found',
        code: ERROR_CODES.OTP_EXPIRED,
      });
    }

    const isOtpValid = await bcrypt.compare(otp, storedOtp.code);
    if (!isOtpValid) {
      throw new BadRequestException({
        message: 'Invalid OTP',
        code: ERROR_CODES.INVALID_OTP,
      });
    }

    return storedOtp;
  }

  async register(requestId: string, registerDto: RegisterDto) {
    try {
      const { email, username, password, gender } = registerDto;

      // Check for existing user
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        this.logger.warn(`User already exists: ${email}`);
        throw new ConflictException({
          message: 'User already exists',
          code: ERROR_CODES.USER_EXISTS,
        });
      }

      // Check for existing username
      const existingUsername = await this.prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername) {
        this.logger.warn(`Username already exists: ${username}`);
        throw new ConflictException({
          message: 'Username already exists',
          code: ERROR_CODES.USERNAME_EXISTS,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const imageUrl = getImageUrl(gender, username);

      const newUser = await this.prisma.user.create({
        data: {
          email,
          username,
          passwordHash: hashedPassword,
          image: imageUrl,
          role: 'USER',
          gender,
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

      const payload: JwtPayload = {
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      };
      const { accessToken, refreshToken } = await this.getTokens(payload);
      await this.updateRefreshTokenHash(newUser.id, refreshToken);

      // Publish user created event
      try {
        await eventPublisher.publishUserCreated({
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          name: newUser.name || null,
          image: newUser.image || null,
          role: newUser.role,
          gender: newUser.gender || null,
        });
      } catch (error) {
        this.logger.error(`Failed to publish user created event: ${error}`);
      }

      this.logger.log(`User registered successfully: ${newUser.id}`);
      return {
        status: 201,
        message: 'Registration successful',
        data: { ...newUser, accessToken, refreshToken },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Registration error: ${error}`);
      throw new InternalServerErrorException({
        message: 'Registration failed. Please try again later',
        code: ERROR_CODES.REGISTRATION_ERROR,
      });
    }
  }

  async login(requestId: string, loginDto: LoginDto, res: Response) {
    try {
      const { email, password } = loginDto;

      const user = await this.prisma.user.findUnique({
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
        },
      });

      if (!user || !user.passwordHash) {
        this.logger.warn(`Invalid credentials: ${email}`);
        throw new UnauthorizedException({
          message: 'Invalid credentials',
          code: ERROR_CODES.INVALID_CREDENTIALS,
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password: ${email}`);
        throw new UnauthorizedException({
          message: 'Invalid credentials',
          code: ERROR_CODES.INVALID_CREDENTIALS,
        });
      }

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      };

      const { accessToken, refreshToken } = await this.getTokens(payload);
      await this.updateRefreshTokenHash(user.id, refreshToken);

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
        refreshToken,
      };

      // res.cookie('refreshToken', refreshToken, {
      //   httpOnly: true,
      //   secure: env.NODE_ENV === 'production',
      //   sameSite: 'lax',
      //   path: '/',
      //   maxAge: 7 * 24 * 60 * 60 * 1000,
      // });

      this.logger.log(`User logged in successfully: ${user.id}`);
      return {
        status: 200,
        message: 'Login successful',
        data: responseData,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login error: ${error}`);
      throw new InternalServerErrorException({
        message: 'Login failed. Please try again later',
        code: ERROR_CODES.LOGIN_ERROR,
      });
    }
  }

  async logout(requestId: string, headers: any, res: Response) {
    try {
      const userId = headers?.userId;
      if (userId) {
        await this.clearRefreshToken(userId);
      }
      // res.clearCookie('refreshToken', {
      //   httpOnly: true,
      //   secure: env.NODE_ENV === 'production',
      //   sameSite: 'lax',
      //   path: '/',
      // });

      this.logger.log(`User logged out successfully: ${headers?.userId}`);
      return {
        status: 200,
        message: 'Logged out successfully',
      };
    } catch (error: any) {
      this.logger.error(`Logout error: ${error}`);
      throw new InternalServerErrorException({
        message: 'Logout failed. Please try again later',
        code: ERROR_CODES.LOGOUT_ERROR,
      });
    }
  }

  async refreshTokens(requestId: string, req: any, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedException({
          message: 'Refresh token missing',
          code: ERROR_CODES.INVALID_REFRESH_TOKEN,
        });
      }

      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
          secret: env.JWT_REFRESH_SECRET,
        });
      } catch (err) {
        throw new UnauthorizedException({
          message: 'Invalid or expired refresh token',
          code: ERROR_CODES.INVALID_REFRESH_TOKEN,
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          hashedRefreshToken: true,
        },
      });

      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException({
          message: 'Refresh token not found',
          code: ERROR_CODES.INVALID_REFRESH_TOKEN,
        });
      }

      const isMatch = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );
      if (!isMatch) {
        throw new UnauthorizedException({
          message: 'Invalid refresh token',
          code: ERROR_CODES.INVALID_REFRESH_TOKEN,
        });
      }

      const newPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      };

      const { accessToken, refreshToken: newRefreshToken } =
        await this.getTokens(newPayload);

      await this.updateRefreshTokenHash(user.id, newRefreshToken);

      // res.cookie('refreshToken', newRefreshToken, {
      //   httpOnly: true,
      //   secure: env.NODE_ENV === 'production',
      //   sameSite: 'lax',
      //   path: '/',
      //   maxAge: 7 * 24 * 60 * 60 * 1000,
      // });

      return {
        status: 200,
        message: 'Tokens refreshed successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
          },
          accessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getMe(requestId: string, headers: any) {
    try {
      const userId = headers?.userId;
      if (!userId) {
        throw new UnauthorizedException({
          message: 'User not authenticated',
          code: ERROR_CODES.NOT_AUTHENTICATED,
        });
      }

      const userProfile = await this.prisma.user.findUnique({
        where: { id: userId },
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

      if (!userProfile) {
        this.logger.warn(`User not found: ${userId}`);
        throw new NotFoundException({
          message: 'User not found',
          code: ERROR_CODES.USER_NOT_FOUND,
        });
      }

      this.logger.log(`User details fetched: ${userId}`);
      return {
        status: 200,
        message: 'User details fetched successfully',
        data: userProfile,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Error fetching user profile: ${error}`);
      throw new InternalServerErrorException({
        message: 'Failed to fetch user profile. Please try again later',
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async changePassword(
    requestId: string,
    changePasswordDto: ChangePasswordDto,
    headers: any,
  ) {
    try {
      const userId = headers?.userId;
      if (!userId) {
        throw new UnauthorizedException({
          message: 'User not authenticated',
          code: ERROR_CODES.NOT_AUTHENTICATED,
        });
      }

      const { oldPassword, newPassword } = changePasswordDto;

      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!dbUser || !dbUser.passwordHash) {
        this.logger.warn(`User not found for password change: ${userId}`);
        throw new NotFoundException({
          message: 'User not found',
          code: ERROR_CODES.USER_NOT_FOUND,
        });
      }

      const isMatch = await bcrypt.compare(oldPassword, dbUser.passwordHash);
      if (!isMatch) {
        this.logger.warn(`Incorrect old password: ${userId}`);
        throw new UnauthorizedException({
          message: 'Old password is incorrect',
          code: ERROR_CODES.INVALID_OLD_PASSWORD,
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });

      this.logger.log(`Password changed successfully: ${userId}`);
      return {
        status: 200,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Change password error: ${error}`);
      throw new InternalServerErrorException({
        message: 'Password change failed. Please try again later',
        code: ERROR_CODES.CHANGE_PASSWORD_ERROR,
      });
    }
  }

  async forgotPassword(
    requestId: string,
    forgotPasswordDto: ForgotPasswordDto,
  ) {
    try {
      const { email } = forgotPasswordDto;

      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Return success to prevent enumeration
        this.logger.log(`No user found for OTP, returning success: ${email}`);
        return {
          status: 200,
          message: 'If email exists, OTP sent',
        };
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOTP = await bcrypt.hash(otp, 10);

      // Delete any existing OTPs and create a new one
      await this.prisma.$transaction([
        this.prisma.otp.deleteMany({ where: { email } }),
        this.prisma.otp.create({
          data: {
            email,
            code: hashedOTP,
            expiresAt: new Date(Date.now() + 60 * 1000), // 1 minute
          },
        }),
      ]);

      // Send email if transporter is configured
      const transporter = this.getTransporter();
      if (transporter && env.EMAIL_USER) {
        await transporter.sendMail({
          from: env.EMAIL_USER,
          to: email,
          subject: 'Password Reset OTP',
          text: `Your OTP is ${otp}. It expires in 1 minute.`,
        });
        this.logger.log(`OTP email sent: ${email}`);
      } else {
        this.logger.warn(
          `Email not configured, OTP generated but not sent. OTP: ${otp}`,
        );
      }

      this.logger.log(`OTP sent successfully: ${email}`);
      return {
        status: 200,
        message: 'OTP sent successfully',
      };
    } catch (error: any) {
      this.logger.error(`Forgot password error: ${error}`);
      throw new InternalServerErrorException({
        message: 'Failed to send OTP. Please try again later',
        code: ERROR_CODES.OTP_SEND_ERROR,
      });
    }
  }

  async verifyOTP(requestId: string, verifyOtpDto: VerifyOtpDto) {
    try {
      const { email, otp } = verifyOtpDto;

      await this.verifyOtpHelper(email, otp);
      this.logger.log(`OTP verified successfully: ${email}`);
      return {
        status: 200,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn(`OTP verification failed: ${error}`);
      throw new InternalServerErrorException({
        message: 'OTP verification failed',
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async changeForgotPassword(
    requestId: string,
    changeForgotPasswordDto: ChangeForgotPasswordDto,
  ) {
    try {
      const { email, otp, newPassword } = changeForgotPasswordDto;

      const storedOtp = await this.verifyOtpHelper(email, otp);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword },
      });

      await this.prisma.otp.delete({ where: { id: storedOtp.id } });

      this.logger.log(`Password changed successfully via OTP: ${email}`);
      return {
        status: 200,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn(`Change forgot password error: ${error}`);
      throw new InternalServerErrorException({
        message: 'Password reset failed. Please try again later',
        code: ERROR_CODES.CHANGE_PASSWORD_ERROR,
      });
    }
  }
}
