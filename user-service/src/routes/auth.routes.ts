import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  changeForgotPasswordSchema,
} from '../dtos/auth.dto';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword,
);
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);
router.post('/verify-otp', validate(verifyOTPSchema), AuthController.verifyOTP);
router.post(
  '/change-forgot-password',
  validate(changeForgotPasswordSchema),
  AuthController.changeForgotPassword,
);

export default router;
