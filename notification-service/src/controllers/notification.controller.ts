import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export class NotificationController {
  /**
   * Send email notification
   */
  static sendEmail = catchAsync(async (req: Request, res: Response) => {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || (!text && !html)) {
      throw new AppError(
        400,
        'Missing required fields: to, subject, and text or html',
      );
    }

    const result = await NotificationService.sendEmail({
      to,
      subject,
      text,
      html,
    });

    res.status(200).json({
      status: 200,
      message: 'Email sent successfully',
      data: result,
    });
  });

  /**
   * Send push notification via Firebase
   */
  static sendPush = catchAsync(async (req: Request, res: Response) => {
    const { token, title, body, data } = req.body;

    if (!token || !title || !body) {
      throw new AppError(400, 'Missing required fields: token, title, body');
    }

    const result = await NotificationService.sendPushNotification({
      token,
      title,
      body,
      data,
    });

    res.status(200).json({
      status: 200,
      message: 'Push notification sent successfully',
      data: result,
    });
  });

  /**
   * Send batch notifications (email + push)
   */
  static sendBatch = catchAsync(async (req: Request, res: Response) => {
    const { emails, pushNotifications } = req.body;

    const results = await NotificationService.sendBatch({
      emails: emails || [],
      pushNotifications: pushNotifications || [],
    });

    res.status(200).json({
      status: 200,
      message: 'Batch notifications processed',
      data: results,
    });
  });
  static getNotifications = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isRead =
      req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;

    const result = await NotificationService.getNotifications(
      { userId, isRead },
      limit,
      page,
    );

    res.status(200).json({
      status: 200,
      message: 'Notifications fetched successfully',
      data: {
        notifications: result.data,
        pagination: result.meta,
      },
    });
  });

  static markAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    const result = await NotificationService.markAsRead(id, userId);

    res.status(200).json({
      status: 200,
      message: 'Notification marked as read',
      data: result,
    });
  });

  static markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;

    const result = await NotificationService.markAllAsRead(userId);

    res.status(200).json({
      status: 200,
      message: 'All notifications marked as read',
      data: result,
    });
  });
}
