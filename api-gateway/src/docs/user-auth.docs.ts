import { SwaggerBuilder } from "../utils/swaggerBuilder";

/**
 * User Authentication Routes Documentation
 * All authentication-related endpoints for user management
 */
export const addUserAuthRoutes = (builder: SwaggerBuilder) => {
  // Register
  builder.addRoute("/api/v1/user/auth/register", "POST", {
    summary: "User Registration",
    description: "Create a new user account with email, username and password",
    tags: ["User - Authentication"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "username", "password", "name", "gender"],
            properties: {
              email: {
                type: "string",
                format: "email",
                description: "User email address",
                example: "user@example.com",
              },
              username: {
                type: "string",
                minLength: 3,
                maxLength: 30,
                pattern: "^[a-zA-Z0-9_]+$",
                description:
                  "Unique username (3-30 chars, letters, numbers, underscores only)",
                example: "johndoe",
              },
              password: {
                type: "string",
                format: "password",
                minLength: 8,
                maxLength: 100,
                description: "User password (8-100 characters)",
                example: "SecurePass123!",
              },
              name: {
                type: "string",
                minLength: 1,
                description: "User's full name (optional)",
                example: "John Doe",
              },
              gender: {
                type: "string",
                enum: ["Male", "Female", "Other"],
                description: "User's gender (optional)",
                example: "Male",
              },
            },
          },
        },
      },
    },
    successDataSchema: {
      type: "object",
      properties: {
        id: { type: "string", example: "cmin2qawp0000eixs6ln19ow8" },
        email: { type: "string", format: "email", example: "user@example.com" },
        username: { type: "string", example: "johndoe" },
        name: { type: "string", nullable: true, example: "John Doe" },
        gender: { type: "string", example: "Male" },
        role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
        image: {
          type: "string",
          format: "uri",
          example: "https://avatar.iran.liara.run/public/boy?username=johndoe",
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        accessToken: { type: "string", description: "JWT access token" },
      },
    },
    successExample: {
      success: true,
      status: {
        code: 201,
        description: "Created",
      },
      message: "Registration successful",
      timestamp: "2025-12-16T07:19:20.000Z",
      responseTimeMs: 150,
      requestId: "123e4567-e89b-12d3-a456-426614174000",
      data: {
        id: "cmin2qawp0000eixs6ln19ow8",
        email: "user@example.com",
        username: "johndoe",
        name: "John Doe",
        gender: "Male",
        role: "USER",
        image: "https://avatar.iran.liara.run/public/boy?username=johndoe",
        createdAt: "2025-12-16T07:19:20.000Z",
        updatedAt: "2025-12-16T07:19:20.000Z",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      error: null,
      requestContext: {
        path: "/api/v1/user/auth/register",
        method: "POST",
      },
    },
    errorCodes: ["422", "409", "500"],
  });

  // Login
  builder.addRoute("/api/v1/user/auth/login", "POST", {
    summary: "User Login",
    description: "Authenticate a user with email and password",
    tags: ["User - Authentication"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: {
                type: "string",
                format: "email",
                example: "user@example.com",
              },
              password: {
                type: "string",
                format: "password",
                example: "SecurePass123!",
              },
            },
          },
        },
      },
    },
    successDataSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string", format: "email" },
        username: { type: "string" },
        name: { type: "string", nullable: true },
        gender: { type: "string" },
        image: { type: "string", format: "uri" },
        role: { type: "string", enum: ["USER", "ADMIN"] },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        accessToken: { type: "string" },
      },
    },
    successExample: {
      success: true,
      status: {
        code: 200,
        description: "OK",
      },
      message: "Login successful",
      timestamp: "2025-12-16T07:19:20.000Z",
      responseTimeMs: 14,
      requestId: "123e4567-e89b-12d3-a456-426614174000",
      locale: "en-US",
      data: {
        id: "cmin2qawp0000eixs6ln19ow8",
        email: "user@example.com",
        username: "johndoe",
        name: "John Doe",
        gender: "Male",
        image: "https://avatar.iran.liara.run/public/boy?username=johndoe",
        role: "USER",
        createdAt: "2025-12-16T07:19:20.000Z",
        updatedAt: "2025-12-16T07:19:20.000Z",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      error: null,
      requestContext: {
        path: "/api/v1/user/auth/login",
        method: "POST",
      },
    },
    errorCodes: ["422", "401", "500"],
  });

  // Logout
  builder.addRoute("/api/v1/user/auth/logout", "POST", {
    summary: "User Logout",
    description: "Logout user (clears token on client side)",
    tags: ["User - Authentication"],
    successDataSchema: {
      type: "object",
      nullable: true,
      example: null,
    },
    successExample: {
      success: true,
      status: {
        code: 200,
        description: "OK",
      },
      message: "Logged out successfully",
      timestamp: "2025-12-16T07:19:20.000Z",
      responseTimeMs: 10,
      requestId: "123e4567-e89b-12d3-a456-426614174000",
      locale: "en-US",
      data: null,
      error: null,
      requestContext: {
        path: "/api/v1/user/auth/logout",
        method: "POST",
      },
    },
    errorCodes: ["401", "500"],
    security: [{ BearerAuth: [] }],
  });

  // Change Password
  builder.addRoute("/api/v1/user/auth/change-password", "POST", {
    summary: "Change Password",
    description: "Change user password (requires authentication)",
    tags: ["User - Authentication"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["oldPassword", "newPassword"],
            properties: {
              oldPassword: {
                type: "string",
                format: "password",
                description: "Current password",
                example: "OldPassword123!",
              },
              newPassword: {
                type: "string",
                format: "password",
                minLength: 8,
                description: "New password (minimum 8 characters)",
                example: "NewPassword123!",
              },
            },
          },
        },
      },
    },
    successDataSchema: {
      type: "object",
      nullable: true,
      example: null,
    },
    successExample: {
      status: 200,
      message: "Password changed successfully",
      data: null,
      meta: {
        requestId: "123e4567-e89b-12d3-a456-426614174000",
        timestamp: "2025-12-16T07:19:20.000Z",
        processingTime: "120ms",
      },
      request: {
        path: "/api/v1/user/auth/change-password",
        method: "POST",
      },
    },
    errorCodes: ["400", "401", "500"],
    security: [{ BearerAuth: [] }],
  });

  // Forgot Password
  builder.addRoute("/api/v1/user/auth/forgot-password", "POST", {
    summary: "Forgot Password",
    description: "Request OTP for password reset",
    tags: ["User - Authentication"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email"],
            properties: {
              email: {
                type: "string",
                format: "email",
                description: "User email address",
                example: "user@example.com",
              },
            },
          },
        },
      },
    },
    successDataSchema: {
      type: "object",
      nullable: true,
      example: null,
    },
    successExample: {
      status: 200,
      message: "OTP sent successfully",
      data: null,
      meta: {
        requestId: "123e4567-e89b-12d3-a456-426614174000",
        timestamp: "2025-12-16T07:19:20.000Z",
        processingTime: "500ms",
      },
      request: {
        path: "/api/v1/user/auth/forgot-password",
        method: "POST",
      },
    },
    errorCodes: ["400", "500"],
  });

  // Verify OTP
  builder.addRoute("/api/v1/user/auth/verify-otp", "POST", {
    summary: "Verify OTP",
    description: "Verify OTP for password reset",
    tags: ["User - Authentication"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "otp"],
            properties: {
              email: {
                type: "string",
                format: "email",
                description: "User email address",
                example: "user@example.com",
              },
              otp: {
                type: "string",
                pattern: "^[0-9]{6}$",
                description: "6-digit OTP code",
                example: "123456",
              },
            },
          },
        },
      },
    },
    successDataSchema: {
      type: "object",
      nullable: true,
      example: null,
    },
    successExample: {
      status: 200,
      message: "OTP verified successfully",
      data: null,
      meta: {
        requestId: "123e4567-e89b-12d3-a456-426614174000",
        timestamp: "2025-12-16T07:19:20.000Z",
        processingTime: "50ms",
      },
      request: {
        path: "/api/v1/user/auth/verify-otp",
        method: "POST",
      },
    },
    errorCodes: ["400", "401", "500"],
  });

  // Change Forgot Password
  builder.addRoute("/api/v1/user/auth/change-forgot-password", "POST", {
    summary: "Reset Password with OTP",
    description: "Change password using verified OTP",
    tags: ["User - Authentication"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "otp", "newPassword"],
            properties: {
              email: {
                type: "string",
                format: "email",
                description: "User email address",
                example: "user@example.com",
              },
              otp: {
                type: "string",
                pattern: "^[0-9]{6}$",
                description: "6-digit OTP code",
                example: "123456",
              },
              newPassword: {
                type: "string",
                format: "password",
                minLength: 8,
                description: "New password (minimum 8 characters)",
                example: "NewPassword123!",
              },
            },
          },
        },
      },
    },
    successDataSchema: {
      type: "object",
      nullable: true,
      example: null,
    },
    successExample: {
      status: 200,
      message: "Password changed successfully",
      data: null,
      meta: {
        requestId: "123e4567-e89b-12d3-a456-426614174000",
        timestamp: "2025-12-16T07:19:20.000Z",
        processingTime: "150ms",
      },
      request: {
        path: "/api/v1/user/auth/change-forgot-password",
        method: "POST",
      },
    },
    errorCodes: ["400", "401", "500"],
  });

  return builder;
};
