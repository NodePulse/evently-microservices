export const userProfileDocs = {
  "/api/v1/user/profile/details": {
    get: {
      tags: ["User - Profile"],
      summary: "Get user profile",
      description: "Retrieve authenticated user profile details",
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      responses: {
        "200": {
          description: "Profile retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                status: 200,
                message: "Profile retrieved successfully",
                data: {
                  user: {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    email: "user@example.com",
                    name: "John Doe",
                    isVerified: true,
                    createdAt: "2024-01-01T00:00:00.000Z",
                    updatedAt: "2024-01-01T00:00:00.000Z",
                  },
                },
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
  "/api/v1/user/profile/update": {
    put: {
      tags: ["User - Profile"],
      summary: "Update user profile",
      description: "Update authenticated user profile information",
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "User full name",
                  example: "John Smith",
                },
                email: {
                  type: "string",
                  format: "email",
                  description: "User email address",
                  example: "newmail@example.com",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Profile updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                status: 200,
                message: "Profile updated successfully",
                data: {
                  user: {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    email: "newmail@example.com",
                    name: "John Smith",
                    isVerified: true,
                    updatedAt: "2024-01-02T00:00:00.000Z",
                  },
                },
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
  "/api/v1/user/profile/change-password": {
    put: {
      tags: ["User - Profile"],
      summary: "Change password",
      description: "Change authenticated user password",
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["currentPassword", "newPassword"],
              properties: {
                currentPassword: {
                  type: "string",
                  format: "password",
                  description: "Current password",
                  example: "CurrentPassword123!",
                },
                newPassword: {
                  type: "string",
                  format: "password",
                  minLength: 8,
                  description: "New password (minimum 8 characters)",
                  example: "NewSecurePassword123!",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Password changed successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                status: 200,
                message: "Password changed successfully",
                data: null,
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};
