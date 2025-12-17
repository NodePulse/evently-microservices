import { z } from 'zod';

/**
 * Authentication DTOs using Zod for validation
 */

// Register DTO
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores',
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
  name: z.string().min(1, 'Name is required').optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
});

export type RegisterDTO = z.infer<typeof registerSchema>;

// Login DTO
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDTO = z.infer<typeof loginSchema>;

// Change Password DTO
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be at most 100 characters'),
});

export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;

// Forgot Password DTO
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;

// Verify OTP DTO
export const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export type VerifyOTPDTO = z.infer<typeof verifyOTPSchema>;

// Change Forgot Password DTO
export const changeForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be at most 100 characters'),
});

export type ChangeForgotPasswordDTO = z.infer<
  typeof changeForgotPasswordSchema
>;
