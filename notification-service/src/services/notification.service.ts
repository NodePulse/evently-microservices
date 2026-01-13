import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import config from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import prisma from '../prisma';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey?.replace(/\\n/g, '\n'),
      }),
    });
    logger.info('Firebase Admin initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin', error);
  }
}

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.emailUser,
    pass: config.emailPass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface PushOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface BatchOptions {
  emails: EmailOptions[];
  pushNotifications: PushOptions[];
}

export class NotificationService {
  /**
   * Helper to log notifications
   */
  public static async logNotification(data: {
    recipient: string;
    type: string;
    status: string;
    subject?: string;
    error?: string;
    metadata?: any;
    message?: string;
    sendTo?: string;
    title?: string;
  }) {
    try {
      if (prisma) {
        await prisma.notificationLog.create({
          data: {
            recipient: data.recipient,
            type: data.type,
            title: data.title,
            status: data.status,
            error: data.error,
            metadata: data.metadata || {},
          },
        });
      }
    } catch (err) {
      logger.error('Failed to log notification to DB', err);
    }
  }

  // get all notifications
  public static async getNotifications(
    filters: { userId?: string; isRead?: boolean },
    limit: number = 20,
    page: number = 1,
  ) {
    try {
      if (!prisma) {
        throw new Error('Prisma client not initialized');
      }

      const skip = (page - 1) * limit;
      const where: any = {};

      if (filters.userId) where.recipient = filters.userId;
      if (filters.isRead !== undefined) where.isRead = filters.isRead;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notificationLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notificationLog.count({ where }),
        prisma.notificationLog.count({
          where: {
            recipient: filters.userId,
            isRead: false,
          },
        }),
      ]);

      return {
        data: notifications,
        meta: {
          total,
          unreadCount,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      logger.error('Failed to get notifications from DB', err);
      throw err;
    }
  }

  // Mark single notification as read
  public static async markAsRead(id: string, userId: string) {
    try {
      if (!prisma) throw new Error('Prisma client not initialized');

      return await prisma.notificationLog.update({
        where: { id, recipient: userId },
        data: { isRead: true },
      });
    } catch (err) {
      logger.error(`Failed to mark notification ${id} as read`, err);
      throw err;
    }
  }

  // Mark all notifications as read for a user
  public static async markAllAsRead(userId: string) {
    try {
      if (!prisma) throw new Error('Prisma client not initialized');

      return await prisma.notificationLog.updateMany({
        where: { recipient: userId, isRead: false },
        data: { isRead: true },
      });
    } catch (err) {
      logger.error(
        `Failed to mark all notifications as read for user ${userId}`,
        err,
      );
      throw err;
    }
  }

  /**
   * Send an email
   */
  static async sendEmail(options: EmailOptions): Promise<any> {
    try {
      const { to, subject, text, html } = options;

      const mailOptions = {
        from: config.emailUser,
        to,
        subject,
        text,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);

      await this.logNotification({
        recipient: to,
        type: 'EMAIL',
        status: 'SUCCESS',
        subject,
        metadata: { messageId: info.messageId },
      });

      return {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error: any) {
      logger.error('Failed to send email', error);

      await this.logNotification({
        recipient: options.to,
        type: 'EMAIL',
        status: 'FAILED',
        subject: options.subject,
        error: error.message || String(error),
      });

      throw new AppError(500, 'Failed to send email notification');
    }
  }

  /**
   * Send push notification via Firebase Cloud Messaging
   */
  static async sendPushNotification(options: PushOptions): Promise<any> {
    try {
      const { token, title, body, data } = options;

      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token,
      };

      const response = await admin.messaging().send(message);
      logger.info(`Push notification sent to ${token}: ${response}`);

      await this.logNotification({
        recipient: token,
        type: 'PUSH',
        status: 'SUCCESS',
        metadata: { messageId: response, title },
      });

      return {
        messageId: response,
        success: true,
      };
    } catch (error: any) {
      logger.error('Failed to send push notification', error);

      await this.logNotification({
        recipient: options.token,
        type: 'PUSH',
        status: 'FAILED',
        error: error.message || String(error),
        metadata: { title: options.title },
      });

      throw new AppError(500, 'Failed to send push notification');
    }
  }

  /**
   * Send batch notifications
   */
  static async sendBatch(options: BatchOptions): Promise<any> {
    const { emails, pushNotifications } = options;
    const results = {
      emails: { success: 0, failed: 0, errors: [] as string[] },
      push: { success: 0, failed: 0, errors: [] as string[] },
    };

    // Send emails
    for (const emailOpts of emails) {
      try {
        await this.sendEmail(emailOpts);
        results.emails.success++;
      } catch (error) {
        results.emails.failed++;
        results.emails.errors.push(`Failed to send to ${emailOpts.to}`);
      }
    }

    // Send push notifications
    for (const pushOpts of pushNotifications) {
      try {
        await this.sendPushNotification(pushOpts);
        results.push.success++;
      } catch (error) {
        results.push.failed++;
        results.push.errors.push(`Failed to send to ${pushOpts.token}`);
      }
    }

    logger.info('Batch notifications completed', results);
    return results;
  }

  /**
   * Send OTP email (commonly used for auth)
   */
  static async sendOTPEmail(email: string, otp: string): Promise<any> {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Your OTP Code</h2>
        <p>Use this code to verify your account:</p>
        <h1 style="background: #f0f0f0; padding: 15px; text-align: center; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Your Verification Code - Evently',
      html,
    });
  }

  /**
   * Send event reminder
   */
  static async sendEventReminder(
    email: string,
    eventTitle: string,
    eventDate: string,
  ): Promise<any> {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Event Reminder</h2>
        <p>This is a reminder for your upcoming event:</p>
        <h3>${eventTitle}</h3>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p>Don't forget to mark your calendar!</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Reminder: ${eventTitle}`,
      html,
    });
  }
}
