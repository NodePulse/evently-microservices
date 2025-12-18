/**
 * Swagger Documentation Builder
 * Provides reusable components and helper functions for building OpenAPI/Swagger docs
 * Adapted to match the current API response format
 */

interface RouteConfig {
  summary: string;
  description: string;
  tags?: string[];
  requestBody?: any;
  successDataSchema: any;
  successExample?: any;
  errorCodes?: string[];
  security?: any[];
}

const internalserver = {
  register: {
    message: "Registration failed!",
    code: "REGISTRATION_ERROR",
  },
  login: {
    message: "Login failed!",
    code: "LOGIN_ERROR",
  },
  logout: {
    message: "Logout failed!",
    code: "LOGOUT_ERROR",
  },
  "change-password": {
    message: "Change password failed!",
    code: "CHANGE_PASSWORD_ERROR",
  },
  "forgot-password": {
    message: "OTP send failed!",
    code: "OTP_SEND_ERROR",
  },
  "change-forgot-password": {
    message: "Change password failed!",
    code: "CHANGE_PASSWORD_ERROR",
  },
};

const unauthorized = {
  login: {
    message: "Invalid credentials!",
    code: "INVALID_CREDENTIALS",
  },
  logout: {
    message: "Not authenticated!",
    code: "NOT_AUTHENTICATED",
  },
  "change-password": {
    message: "Not authenticated!",
    code: "NOT_AUTHENTICATED",
  },
  "forgot-password": {
    message: "Not authenticated!",
    code: "NOT_AUTHENTICATED",
  },
};

const notFound = {
  "change-password": {
    message: "User not found!",
    code: "USER_NOT_FOUND",
  },
  "change-forgot-password": {
    message: "User not found!",
    code: "USER_NOT_FOUND",
  },
};

const gone = {
  "verify-otp": {
    message: "OTP expired!",
    code: "OTP_EXPIRED",
  },
  "change-forgot-password": {
    message: "OTP expired!",
    code: "OTP_EXPIRED",
  },
};

const limitExceed = {
  login: {
    message: "Too many login attempts, please try again after 15 minutes",
    code: "LOGIN_RATE_LIMIT_EXCEEDED",
  },
  "forgot-password": {
    message:
      "Too many OTP requests. Only 3 OTPs allowed per 24 hours. Please try again later.",
    code: "OTP_RATE_LIMIT_EXCEEDED",
  },
};

const validationError = {
  "verify-otp": {
    message: "Invalid OTP!",
    code: "INVALID_OTP",
  },
};

const internalServerErrorMessage = (path: string) => {
  const mainPath = path.split("/").pop() || "";
  const errorInfo = internalserver[mainPath as keyof typeof internalserver];

  return {
    message: errorInfo?.message || "Internal server error",
    code: errorInfo?.code || "INTERNAL_ERROR",
  };
};

const unauthorizedErrorMessage = (path: string) => {
  const mainPath = path.split("/").pop() || "";
  const errorInfo = unauthorized[mainPath as keyof typeof unauthorized];

  return {
    message: errorInfo?.message || "Unauthorized",
    code: errorInfo?.code || "UNAUTHORIZED",
  };
};

const notFoundErrorMessage = (path: string) => {
  const mainPath = path.split("/").pop() || "";
  const errorInfo = notFound[mainPath as keyof typeof notFound];

  return {
    message: errorInfo?.message || "Not found",
    code: errorInfo?.code || "NOT_FOUND",
  };
};

const goneErrorMessage = (path: string) => {
  const mainPath = path.split("/").pop() || "";
  const errorInfo = gone[mainPath as keyof typeof gone];

  return {
    message: errorInfo?.message || "Gone",
    code: errorInfo?.code || "GONE",
  };
};

const validationErrorMessage = (path: string) => {
  const mainPath = path.split("/").pop() || "";
  const errorInfo = validationError[mainPath as keyof typeof validationError];

  return {
    message: errorInfo?.message || "Validation error",
    code: errorInfo?.code || "VALIDATION_ERROR",
  };
};

const limitExceedErrorMessage = (path: string) => {
  const mainPath = path.split("/").pop() || "";
  const errorInfo = limitExceed[mainPath as keyof typeof limitExceed];

  return {
    message: errorInfo?.message || "Limit exceeded",
    code: errorInfo?.code || "LIMIT_EXCEEDED",
  };
};

export class SwaggerBuilder {
  private doc: any;

  constructor() {
    this.doc = {
      openapi: "3.0.0",
      info: {
        title: "API Documentation",
        version: "1.0.0",
        description: "API documentation with standardized responses",
      },
      servers: [],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Enter your JWT token",
          },
          CookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "accessToken",
            description: "JWT token stored in cookie",
          },
        },
      },
      tags: [],
    };
  }

  /**
   * Set API info
   */
  setInfo(title: string, version: string, description: string) {
    this.doc.info = { title, version, description };
    return this;
  }

  /**
   * Add servers
   */
  addServers(servers: any[]) {
    this.doc.servers = servers;
    return this;
  }

  /**
   * Add tags
   */
  addTags(tags: any[]) {
    this.doc.tags = tags;
    return this;
  }

  /**
   * Get common response wrapper schema matching current format
   */
  static getResponseWrapper(dataSchema: any, statusCode = 200) {
    return {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: statusCode < 400,
        },
        status: {
          type: "object",
          properties: {
            code: {
              type: "integer",
              example: statusCode,
            },
            description: {
              type: "string",
              example: statusCode >= 400 ? "Error" : "Success",
            },
          },
        },
        message: {
          type: "string",
          example:
            statusCode >= 400 ? "Error occurred" : "Operation successful",
        },
        timestamp: {
          type: "string",
          format: "date-time",
          example: "2025-12-16T07:19:20.000Z",
        },
        responseTimeMs: {
          type: "integer",
          example: 150,
        },
        requestId: {
          type: "string",
          format: "uuid",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
        locale: {
          type: "string",
          example: "en-US",
        },
        data: dataSchema || {
          type: "object",
          nullable: true,
          example: null,
        },
        error: {
          type: "object",
          nullable: true,
          example:
            statusCode >= 400
              ? {
                  code: "",
                  message: "",
                  details: {
                    field: "",
                    message: "",
                    nullable: true,
                  },
                }
              : null,
        },
        requestContext: {
          type: "object",
          properties: {
            path: {
              type: "string",
              example: "/api/endpoint",
            },
            method: {
              type: "string",
              example: "GET",
            },
          },
        },
      },
    };
  }

  /**
   * Get standard error responses
   */
  static getStandardErrors(path: string, method: string) {
    return {
      BadRequest: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: SwaggerBuilder.getResponseWrapper(
              {
                type: "object",
                properties: {
                  code: { type: "string", example: "BAD_REQUEST" },
                  message: { type: "string", example: "Invalid request" },
                },
              },
              400
            ),
          },
        },
      },
      ValidationError: {
        description: "Validation Error",
        content: {
          "application/json": {
            schema: SwaggerBuilder.getResponseWrapper(
              {
                type: "object",
                properties: {
                  code: { type: "string", example: "VALIDATION_ERROR" },
                  message: { type: "string", example: "Invalid input data" },
                  details: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string", example: "email" },
                        message: { type: "string", example: "Invalid email" },
                      },
                    },
                  },
                },
              },
              422
            ),
            example: {
              success: false,
              status: {
                code: 422,
                description: path.includes("verify-otp")
                  ? "Invalid OTP"
                  : "Validation Error",
              },
              message: validationErrorMessage(path).message,
              timestamp: "2025-12-16T07:19:20.000Z",
              responseTimeMs: 14,
              requestId: "123e4567-e89b-12d3-a456-426614174000",
              locale: "en-US",
              data: null,
              error: {
                code: validationErrorMessage(path).code,
                message: validationErrorMessage(path).message,
                ...(!path.includes("verify-otp") && {
                  details: [
                    {
                      field: "field name",
                      message: "field validation message",
                    },
                  ],
                }),
              },
              requestContext: {
                path: path,
                method: method,
              },
            },
          },
        },
      },
      Unauthorized: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: SwaggerBuilder.getResponseWrapper(
              {
                type: "object",
                properties: {
                  code: { type: "string", example: "UNAUTHORIZED" },
                  message: {
                    type: "string",
                    example: "Authentication required",
                  },
                },
              },
              401
            ),
            example: {
              success: false,
              status: {
                code: 401,
                description: "Unauthorized",
              },
              message: unauthorizedErrorMessage(path).message,
              timestamp: "2025-12-16T07:19:20.000Z",
              responseTimeMs: 14,
              requestId: "123e4567-e89b-12d3-a456-426614174000",
              locale: "en-US",
              data: null,
              error: {
                message: unauthorizedErrorMessage(path).message,
                code: unauthorizedErrorMessage(path).code,
              },
              requestContext: {
                path: path,
                method: method,
              },
            },
          },
        },
      },
      NotFound: {
        description: "Not Found",
        content: {
          "application/json": {
            schema: SwaggerBuilder.getResponseWrapper(
              {
                type: "object",
                properties: {
                  code: { type: "string", example: "NOT_FOUND" },
                  message: { type: "string", example: "Not found!" },
                },
              },
              404
            ),
            example: {
              success: false,
              status: {
                code: 404,
                description: "Not found!",
              },
              message: notFoundErrorMessage(path).message,
              timestamp: "2025-12-16T07:19:20.000Z",
              responseTimeMs: 14,
              requestId: "123e4567-e89b-12d3-a456-426614174000",
              locale: "en-US",
              data: null,
              error: {
                message: notFoundErrorMessage(path).message,
                code: notFoundErrorMessage(path).code,
              },
              requestContext: {
                path: path,
                method: method,
              },
            },
          },
        },
      },
      InternalServerError: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: SwaggerBuilder.getResponseWrapper(
              {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Internal server error!",
                  },
                  code: { type: "string", example: "INTERNAL_ERROR" },
                },
              },
              500
            ),
            example: {
              success: false,
              status: {
                code: 500,
                description: "Internal Server Error",
              },
              message: internalServerErrorMessage(path).message,
              timestamp: "2025-12-16T07:19:20.000Z",
              responseTimeMs: 14,
              requestId: "123e4567-e89b-12d3-a456-426614174000",
              locale: "en-US",
              data: null,
              error: {
                message: internalServerErrorMessage(path).message,
                code: internalServerErrorMessage(path).code,
              },
              requestContext: {
                path: path,
                method: method,
              },
            },
          },
        },
      },
      ConflictError: {
        description: "Conflict Error",
        content: {
          "application/json": {
            schema: SwaggerBuilder.getResponseWrapper(
              {
                type: "object",
                properties: {
                  message: { type: "string", example: "User already exists!" },
                  code: { type: "string", example: "CONFLICT_ERROR" },
                },
              },
              409
            ),
            example: {
              success: false,
              status: {
                code: 409,
                description: "Conflict Error",
              },
              message: "User already exists!",
              timestamp: "2025-12-16T07:19:20.000Z",
              responseTimeMs: 14,
              requestId: "123e4567-e89b-12d3-a456-426614174000",
              locale: "en-US",
              data: null,
              error: {
                message: "User already exists!",
                code: "USER_EXISTS",
              },
              requestContext: {
                path: path,
                method: method,
              },
            },
          },
        },
      },
      GoneError: {
        description: "Gone Error",
        content: {
          "application/json": {
            schema: SwaggerBuilder.getResponseWrapper(
              {
                type: "object",
                properties: {
                  message: { type: "string", example: "Expired!" },
                  code: { type: "string", example: "GONE_ERROR" },
                },
              },
              410
            ),
            example: {
              success: false,
              status: {
                code: 410,
                description: "Gone Error",
              },
              message: goneErrorMessage(path).message,
              timestamp: "2025-12-16T07:19:20.000Z",
              responseTimeMs: 14,
              requestId: "123e4567-e89b-12d3-a456-426614174000",
              locale: "en-US",
              data: null,
              error: {
                message: goneErrorMessage(path).message,
                code: goneErrorMessage(path).code,
              },
              requestContext: {
                path: path,
                method: method,
              },
            },
          },
        },
      },
      LimitExceedError: {
        description: "Limit Exceed Error",
        content: {
          "application/json": {
            schema: SwaggerBuilder.getResponseWrapper(
              {
                type: "object",
                properties: {
                  message: { type: "string", example: "Limit exceeded!" },
                  code: { type: "string", example: "LIMIT_EXCEEDED" },
                },
              },
              429
            ),
            example: {
              success: false,
              status: {
                code: 429,
                description: "Limit Exceeded Error",
              },
              message: limitExceedErrorMessage(path).message,
              timestamp: "2025-12-16T07:19:20.000Z",
              responseTimeMs: 14,
              requestId: "123e4567-e89b-12d3-a456-426614174000",
              locale: "en-US",
              data: null,
              error: {
                message: limitExceedErrorMessage(path).message,
                code: limitExceedErrorMessage(path).code,
              },
              requestContext: {
                path: path,
                method: method,
              },
            },
          },
        },
      },
    };
  }

  /**
   * Add a route to the documentation
   */
  addRoute(path: string, method: string, config: RouteConfig) {
    if (!this.doc.paths[path]) {
      this.doc.paths[path] = {};
    }

    const {
      summary,
      description,
      tags = [],
      requestBody,
      successDataSchema,
      successExample,
      errorCodes = ["422", "401", "500", "409", "429"],
      security = [],
    } = config;

    const responses: any = {
      "200": {
        description: "Successful operation",
        content: {
          "application/json": {
            schema: SwaggerBuilder.getResponseWrapper(successDataSchema),
            ...(successExample && { example: successExample }),
          },
        },
      },
    };

    // Add specified error responses
    const standardErrors = SwaggerBuilder.getStandardErrors(path, method);
    errorCodes.forEach((code) => {
      const errorKey = {
        "400": "BadRequest",
        "422": "ValidationError",
        "401": "Unauthorized",
        "404": "NotFound",
        "410": "GoneError",
        "500": "InternalServerError",
        "409": "ConflictError",
        "429": "LimitExceedError",
      }[code];

      if (errorKey && standardErrors[errorKey as keyof typeof standardErrors]) {
        responses[code] =
          standardErrors[errorKey as keyof typeof standardErrors];
      }
    });

    this.doc.paths[path][method.toLowerCase()] = {
      summary,
      description,
      tags,
      ...(requestBody && { requestBody }),
      responses,
      ...(security.length > 0 && { security }),
    };

    return this;
  }

  /**
   * Add a schema to components
   */
  addSchema(name: string, schema: any) {
    this.doc.components.schemas[name] = schema;
    return this;
  }

  /**
   * Add standard response schemas
   */
  addStandardSchemas(path: string, method: string) {
    const errors = SwaggerBuilder.getStandardErrors(path, method);
    this.doc.components.responses = errors;
    return this;
  }

  /**
   * Generate the complete Swagger document
   */
  build() {
    return this.doc;
  }
}
