import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { LoginDto } from '../auth/dto/login.dto';
import { RegisterDto } from '../auth/dto/register.dto';

export function ApiLoginDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Login to an existing user',
      description: 'Login to an existing user account with email, password.',
    }),
    ApiBody({
      type: LoginDto,
      description: 'User login details',
      examples: {
        example1: {
          summary: 'Valid Login Request',
          value: {
            email: 'user@example.com',
            password: 'Password123',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User registered successfully.',
      schema: {
        example: {
          success: true,
          status: {
            code: 200,
            description: 'OK',
          },
          message: 'Login successful',
          timestamp: '2025-12-01T10:30:00.000Z',
          responseTimeMs: 150,
          requestId: 'uuid-string',
          locale: 'en-US',
          data: {
            id: 'uuid-string',
            email: 'user@example.com',
            username: 'new_user',
            name: 'John Doe',
            gender: 'Male',
            image: 'https://avatar-url.com',
            role: 'USER',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            accessToken: 'jwt.token.string',
          },
          meta: {
            apiVersion: 'v1',
          },
          requestContext: {
            path: '/api/v1/user/auth/login',
            method: 'POST',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid input data (e.g., weak password, invalid email).',
      schema: {
        example: {
          success: false,
          status: {
            code: 400,
            description: 'Bad Request',
          },
          message: [
            'Invalid email address',
            'Username can only contain letters, numbers, and underscores',
            'Username cannot exceed 50 characters',
            'Username must be at least 3 characters',
            'username must be a string',
            'Password must contain at least one lowercase letter, one uppercase letter, one digit, and can include @$!%*?&',
            'Password cannot exceed 128 characters',
            'Password must be at least 8 characters long',
            'password must be a string',
            'Gender must be Male, Female, or Other',
          ],
          timestamp: '2025-12-01T10:30:00.000Z',
          responseTimeMs: 50,
          requestId: 'uuid-string',
          locale: 'en-US',
          error: {
            message: [
              'Invalid email address',
              'Username can only contain letters, numbers, and underscores',
              'Username cannot exceed 50 characters',
              'Username must be at least 3 characters',
              'username must be a string',
              'Password must contain at least one lowercase letter, one uppercase letter, one digit, and can include @$!%*?&',
              'Password cannot exceed 128 characters',
              'Password must be at least 8 characters long',
              'password must be a string',
              'Gender must be Male, Female, or Other',
            ],
            code: 'VALIDATION_ERROR',
          },
          meta: {
            apiVersion: 'v1',
          },
          requestContext: {
            path: '/api/v1/user/auth/register',
            method: 'POST',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'User with the given email or username does not exist.',
      schema: {
        example: {
          success: false,
          status: {
            code: 401,
            description: 'Invalid email or password',
          },
          message: 'Invalid credentials',
          timestamp: '2025-12-01T10:30:00.000Z',
          responseTimeMs: 80,
          requestId: 'uuid-string',
          locale: 'en-US',
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          },
          meta: {
            apiVersion: 'v1',
          },
          requestContext: {
            path: '/api/v1/user/auth/login',
            method: 'POST',
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal server error during login.',
      schema: {
        example: {
          success: false,
          status: {
            code: 500,
            description: 'Internal Server Error',
          },
          message: 'Login failed. Please try again later',
          timestamp: '2025-12-01T10:30:00.000Z',
          responseTimeMs: 120,
          requestId: 'uuid-string',
          locale: 'en-US',
          error: {
            message: 'Login failed. Please try again later',
            code: 'LOGIN_ERROR',
          },
          meta: {
            apiVersion: 'v1',
          },
          requestContext: {
            path: '/api/v1/user/auth/login',
            method: 'POST',
          },
        },
      },
    }),
  );
}

export function ApiRegisterDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a new user',
      description:
        'Creates a new user account with email, username, password, and gender.',
    }),
    ApiBody({
      type: RegisterDto,
      description: 'User registration details',
      examples: {
        example1: {
          summary: 'Valid Registration',
          value: {
            email: 'user@example.com',
            username: 'new_user',
            password: 'Password123',
            gender: 'Male',
            name: 'John Doe',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User registered successfully.',
      schema: {
        example: {
          success: true,
          status: {
            code: 201,
            description: 'Created',
          },
          message: 'Registration successful',
          timestamp: '2025-12-01T10:30:00.000Z',
          responseTimeMs: 150,
          requestId: 'uuid-string',
          locale: 'en-US',
          data: {
            id: 'uuid-string',
            email: 'user@example.com',
            username: 'new_user',
            name: 'John Doe',
            gender: 'Male',
            role: 'USER',
            image: 'https://avatar-url.com',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            accessToken: 'jwt.token.string',
          },
          meta: {
            apiVersion: 'v1',
          },
          requestContext: {
            path: '/api/v1/user/auth/register',
            method: 'POST',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid input data (e.g., weak password, invalid email).',
      schema: {
        example: {
          success: false,
          status: {
            code: 400,
            description: 'Bad Request',
          },
          message: [
            'Invalid email address',
            'Username can only contain letters, numbers, and underscores',
            'Username cannot exceed 50 characters',
            'Username must be at least 3 characters',
            'username must be a string',
            'Password must contain at least one lowercase letter, one uppercase letter, one digit, and can include @$!%*?&',
            'Password cannot exceed 128 characters',
            'Password must be at least 8 characters long',
            'password must be a string',
            'Gender must be Male, Female, or Other',
          ],
          timestamp: '2025-12-01T10:30:00.000Z',
          responseTimeMs: 50,
          requestId: 'uuid-string',
          locale: 'en-US',
          error: {
            message: [
              'Invalid email address',
              'Username can only contain letters, numbers, and underscores',
              'Username cannot exceed 50 characters',
              'Username must be at least 3 characters',
              'username must be a string',
              'Password must contain at least one lowercase letter, one uppercase letter, one digit, and can include @$!%*?&',
              'Password cannot exceed 128 characters',
              'Password must be at least 8 characters long',
              'password must be a string',
              'Gender must be Male, Female, or Other',
            ],
            code: 'VALIDATION_ERROR',
          },
          meta: {
            apiVersion: 'v1',
          },
          requestContext: {
            path: '/api/v1/user/auth/register',
            method: 'POST',
          },
        },
      },
    }),
    ApiConflictResponse({
      description: 'User with the given email or username already exists.',
      schema: {
        example: {
          success: false,
          status: {
            code: 409,
            description: 'Conflict',
          },
          message: 'User already exists',
          timestamp: '2025-12-01T10:30:00.000Z',
          responseTimeMs: 80,
          requestId: 'uuid-string',
          locale: 'en-US',
          error: {
            message: 'User already exists',
            code: 'USER_EXISTS',
          },
          meta: {
            apiVersion: 'v1',
          },
          requestContext: {
            path: '/api/v1/user/auth/register',
            method: 'POST',
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal server error during registration.',
      schema: {
        example: {
          success: false,
          status: {
            code: 500,
            description: 'Internal Server Error',
          },
          message: 'Registration failed. Please try again later',
          timestamp: '2025-12-01T10:30:00.000Z',
          responseTimeMs: 120,
          requestId: 'uuid-string',
          locale: 'en-US',
          error: {
            message: 'Registration failed. Please try again later',
            code: 'REGISTRATION_ERROR',
          },
          meta: {
            apiVersion: 'v1',
          },
          requestContext: {
            path: '/api/v1/user/auth/register',
            method: 'POST',
          },
        },
      },
    }),
  );
}

export function ApiLogoutDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Logout the user',
      description: 'Logout the user and clear the session',
    }),
    ApiResponse({
      status: 200,
      description: 'User logged out successfully',
      schema: {
        example: {
          success: true,
          status: {
            code: 200,
            description: 'OK',
          },
          message: 'User logged out successfully',
          timestamp: '2025-12-01T10:30:00.000Z',
          responseTimeMs: 150,
          requestId: 'uuid-string',
          locale: 'en-US',
          meta: {
            apiVersion: 'v1',
          },
          requestContext: {
            path: '/api/v1/user/auth/logout',
            method: 'POST',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
      schema: {
        example: {
          success: false,
          status: {
            code: 401,
            description: 'Unauthorized',
          },
          message: 'User is not authenticated',
          timestamp: '2025-12-01T10:30:00.000Z',
          responseTimeMs: 150,
          requestId: 'uuid-string',
          locale: 'en-US',
          error: {
            message: 'User is not authenticated',
            code: 'UNAUTHORIZED',
          },
          meta: {
            apiVersion: 'v1',
          },
          requestContext: {
            path: '/api/v1/user/auth/logout',
            method: 'POST',
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal server error',
      schema: {
        example: {
          success: false,
          status: {
            code: 500,
            description: 'Internal Server Error',
          },
          message: 'Internal server error',
          timestamp: '2025-12-01T10:30:00.000Z',
          responseTimeMs: 150,
          requestId: 'uuid-string',
          locale: 'en-US',
          error: {
            message: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
          },
          meta: {
            apiVersion: 'v1',
          },
          requestContext: {
            path: '/api/v1/user/auth/logout',
            method: 'POST',
          },
        },
      },
    }),
  );
}
