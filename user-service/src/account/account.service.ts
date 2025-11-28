import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { env } from '../config/env';
import { ERROR_CODES } from '../constants/errorCodes';
import type { Response } from 'express';
import * as admin from 'firebase-admin';

interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  private firebaseApp: admin.app.App;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    // Initialize Firebase Admin SDK
    try {
      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
        this.logger.log('Firebase Admin SDK initialized successfully');
      } else {
        this.firebaseApp = admin.app();
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  private async getTokens(payload: JwtPayload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const bcrypt = await import('bcrypt');
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  /**
   * Verify Firebase ID token and authenticate user
   */
  async verifyFirebaseToken(
    idToken: string,
    res: Response,
  ): Promise<{
    status: number;
    message: string;
    data: {
      id: string;
      email: string;
      username: string;
      name: string | null;
      image: string | null;
      role: string;
      accessToken: string;
      refreshToken: string;
    };
  }> {
    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const {
        uid: firebaseUid,
        email,
        name,
        picture,
        firebase: { sign_in_provider: provider },
      } = decodedToken;

      if (!email) {
        throw new UnauthorizedException({
          message: 'Email not found in Firebase token',
          code: ERROR_CODES.INVALID_CREDENTIALS,
        });
      }

      this.logger.log(`Firebase token verified for: ${email} via ${provider}`);

      // Check if account already exists with this Firebase UID
      let account = await this.prisma.account.findFirst({
        where: {
          provider: provider || 'firebase',
          providerAccountId: firebaseUid,
        },
        include: {
          user: true,
        },
      });

      let user;

      if (account) {
        // User already linked with this Firebase account
        user = account.user;
        this.logger.log(`Existing Firebase user logged in: ${user.id}`);
      } else {
        // Check if user exists with this email
        user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists, link new Firebase account
          await this.prisma.account.create({
            data: {
              userId: user.id,
              type: 'oauth',
              provider: provider || 'firebase',
              providerAccountId: firebaseUid,
            },
          });
          this.logger.log(
            `Linked Firebase account to existing user: ${user.id}`,
          );
        } else {
          // Create new user with Firebase account
          const username =
            email.split('@')[0] + Math.random().toString(36).substring(2, 7);

          user = await this.prisma.user.create({
            data: {
              email,
              username,
              name: name || null,
              image: picture || null,
              emailVerified: new Date(), // Firebase emails are pre-verified
              role: 'USER',
              accounts: {
                create: {
                  type: 'oauth',
                  provider: provider || 'firebase',
                  providerAccountId: firebaseUid,
                },
              },
            },
          });
          this.logger.log(`Created new user via Firebase: ${user.id}`);
        }
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate JWT tokens
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      };

      const { accessToken, refreshToken } = await this.getTokens(payload);
      await this.updateRefreshTokenHash(user.id, refreshToken);

      return {
        status: 200,
        message: 'Firebase authentication successful',
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          image: user.image,
          role: user.role,
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Firebase authentication error: ${error}`);

      if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException({
          message: 'Firebase token expired',
          code: ERROR_CODES.INVALID_CREDENTIALS,
        });
      }

      if (error.code === 'auth/argument-error') {
        throw new UnauthorizedException({
          message: 'Invalid Firebase token',
          code: ERROR_CODES.INVALID_CREDENTIALS,
        });
      }

      throw new InternalServerErrorException({
        message: 'Firebase authentication failed',
        code: ERROR_CODES.LOGIN_ERROR,
      });
    }
  }
}
