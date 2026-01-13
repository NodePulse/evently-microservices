import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

// Email notifications
router.post('/send-email', NotificationController.sendEmail);

// Push notifications
router.post('/send-push', NotificationController.sendPush);

// Batch notifications
router.post('/send-batch', NotificationController.sendBatch);

// Get notifications
router.get('/', NotificationController.getNotifications);

// Mark all as read
router.patch('/read-all', NotificationController.markAllAsRead);

// Mark as read
router.patch('/:id/read', NotificationController.markAsRead);

export default router;
