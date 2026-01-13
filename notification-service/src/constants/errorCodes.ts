export const ERROR_CODES: Record<string, ErrorCodes> = {
  VALIDATION_ERROR: {
    name: 'VALIDATION_ERROR',
    message: 'Validation failed',
    code: 422,
  },
  INVALID_INPUT: {
    name: 'INVALID_INPUT',
    message: 'Invalid input provided!',
    code: 422,
  },
  USER_EXISTS: {
    name: 'USER_EXISTS',
    message: 'User already exists!',
    code: 409,
  },
  USERNAME_EXISTS: {
    name: 'USERNAME_EXISTS',
    message: 'Username already exists!',
    code: 409,
  },
  REGISTRATION_ERROR: {
    name: 'REGISTRATION_ERROR',
    message: 'Registration failed!',
    code: 500,
  },
  INVALID_CREDENTIALS: {
    name: 'INVALID_CREDENTIALS',
    message: 'Invalid credentials!',
    code: 401,
  },
  LOGIN_ERROR: {
    name: 'LOGIN_ERROR',
    message: 'Login failed!',
    code: 500,
  },
  LOGOUT_ERROR: {
    name: 'LOGOUT_ERROR',
    message: 'Logout failed!',
    code: 500,
  },
  NOT_AUTHENTICATED: {
    name: 'NOT_AUTHENTICATED',
    message: 'Not authenticated!',
    code: 401,
  },
  USER_NOT_FOUND: {
    name: 'USER_NOT_FOUND',
    message: 'User not found!',
    code: 404,
  },
  INTERNAL_SERVER_ERROR: {
    name: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error!',
    code: 500,
  },
  INVALID_OLD_PASSWORD: {
    name: 'INVALID_OLD_PASSWORD',
    message: 'Invalid old password!',
    code: 401,
  },
  CHANGE_PASSWORD_ERROR: {
    name: 'CHANGE_PASSWORD_ERROR',
    message: 'Change password failed!',
    code: 500,
  },
  OTP_SEND_ERROR: {
    name: 'OTP_SEND_ERROR',
    message: 'OTP send failed!',
    code: 500,
  },
  INVALID_OTP: {
    name: 'INVALID_OTP',
    message: 'Invalid OTP!',
    code: 410,
  },
  OTP_EXPIRED: {
    name: 'OTP_EXPIRED',
    message: 'OTP expired!',
    code: 410,
  },
  INVALID_REFRESH_TOKEN: {
    name: 'INVALID_REFRESH_TOKEN',
    message: 'Invalid refresh token!',
    code: 410,
  },
  REFRESH_TOKEN_ERROR: {
    name: 'REFRESH_TOKEN_ERROR',
    message: 'Refresh token error!',
    code: 500,
  },
  PASSWORD_MISMATCH: {
    name: 'PASSWORD_MISMATCH',
    message: 'Password and confirm password should be same!',
    code: 422,
  },
  PASSWORD_SAME: {
    name: 'PASSWORD_SAME',
    message: 'New password should be different from old password!',
    code: 422,
  },
  OTP_VERIFY_ERROR: {
    name: 'OTP_VERIFY_ERROR',
    message: 'OTP verify failed!',
    code: 500,
  },
};
