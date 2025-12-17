import { config } from "../config";
import * as crypto from "crypto";
import { logger } from "./logger";

export interface MetaData {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  links?: Record<string, string | null>;
  apiVersion?: string;
  deprecation?: { message: string; sunsetDate?: string };
  [key: string]: any;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: Array<{ field: string; issue: string; path?: string }>;
  stack?: string | undefined;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  status: {
    code: number;
    description: string;
  };
  message: string;
  timestamp: string;
  responseTimeMs: number;
  requestId: string;
  locale: string;
  data?: T | null;
  meta?: MetaData;
  error?: ErrorResponse | null;
  requestContext?: Record<string, any> | null;
}

const STATUS_MESSAGES: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Validation Error",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

export class ResponseBuilderService {
  private encryptionSecret?: string;
  private encryptionSalt?: string;
  private encryptionAlgorithm = "aes-256-cbc";
  private enableEncryption: boolean;

  constructor() {
    this.enableEncryption = process.env.ENABLE_ENCRYPTION === "true";

    if (this.enableEncryption) {
      this.encryptionSecret = process.env.ENCRYPTION_KEY;
      this.encryptionSalt = process.env.ENCRYPTION_SALT;

      if (!this.encryptionSecret || !this.encryptionSalt) {
        logger.warn(
          "Encryption enabled but ENCRYPTION_KEY or ENCRYPTION_SALT not provided"
        );
        this.enableEncryption = false;
      }
    }
  }

  /**
   * Detect if request is from API testing tool (Insomnia, Postman, Swagger, etc.)
   * These tools should receive unencrypted responses for debugging
   */
  private isApiTestingTool(req?: any): boolean {
    if (!req || !req.headers) {
      // If no headers available, assume it's an API testing tool
      // This handles cases where headers aren't properly forwarded
      return true;
    }

    const userAgent = (req.headers["user-agent"] || "").toLowerCase();
    const customHeader = req.headers["x-skip-encryption"];
    const referer = (
      req.headers["referer"] ||
      req.headers["referrer"] ||
      ""
    ).toLowerCase();
    const origin = (req.headers["origin"] || "").toLowerCase();
    const accept = (req.headers["accept"] || "").toLowerCase();

    // Check for common API testing tools in User-Agent
    const testingTools = [
      "insomnia",
      "postman",
      "curl",
      "httpie",
      "thunder client",
      "rest client",
      "paw",
    ];

    // Skip encryption if custom header is present
    if (customHeader === "true") {
      return true;
    }

    // If User-Agent is empty or very short, likely an API tool
    if (!userAgent || userAgent.length < 10) {
      return true;
    }

    // Check if request is from Swagger UI or API testing tools
    // Swagger UI makes requests from the same origin with specific patterns
    if (referer.includes("/api-docs") || referer.includes("swagger")) {
      return true;
    }

    // If origin matches the server (same-origin) and it's not likely a regular browser request
    // This catches Swagger UI which runs on the same server
    if (
      origin &&
      accept.includes("application/json") &&
      !accept.includes("text/html")
    ) {
      // This is likely an API testing request (Swagger UI, tools, etc.)
      // Regular browser navigation includes text/html
      return true;
    }

    // Check user agent for testing tools
    return testingTools.some((tool) => userAgent.includes(tool));
  }

  createBuilder(
    requestId: string,
    startTime?: [number, number],
    req?: any // Optional request object to detect testing tools
  ): ResponseBuilder {
    // Determine if encryption should be skipped for this request
    const skipEncryption = this.isApiTestingTool(req);
    const shouldEncrypt = this.enableEncryption && !skipEncryption;

    return new ResponseBuilder(
      requestId,
      startTime,
      shouldEncrypt,
      this.encryptionSecret,
      this.encryptionSalt,
      this.encryptionAlgorithm
    );
  }
}

export class ResponseBuilder {
  private startTime: [number, number];
  private requestId: string;
  private statusCode = 200;
  private message?: string;
  private data: any = null;
  private meta: MetaData = {};
  private error: ErrorResponse | null = null;
  private locale = "en-US";
  private requestContext: Record<string, any> | null = null;

  constructor(
    requestId: string,
    startTime: [number, number] = process.hrtime(),
    private enableEncryption: boolean,
    private encryptionSecret?: string,
    private encryptionSalt?: string,
    private encryptionAlgorithm = "aes-256-cbc"
  ) {
    this.requestId = requestId;
    this.startTime = startTime;
  }

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  withMessage(message: string): this {
    this.message = message;
    return this;
  }

  withData<T>(data: T): this {
    this.data = data;
    return this;
  }

  withMeta(meta: MetaData): this {
    this.meta = { ...this.meta, ...meta };
    return this;
  }

  withError(
    message: string,
    code?: string,
    details?: Array<{ field: string; issue: string; path?: string }> | any
  ): this {
    this.error = { message, code, details };
    return this;
  }

  withLocale(locale: string): this {
    this.locale = locale;
    return this;
  }

  withRequestContext(context: Record<string, any>): this {
    this.requestContext = context;
    return this;
  }

  private encryptData(data: any): any {
    if (
      !this.enableEncryption ||
      !this.encryptionSecret ||
      !this.encryptionSalt
    ) {
      return data;
    }

    try {
      const key = crypto.scryptSync(
        this.encryptionSecret,
        this.encryptionSalt,
        32
      );
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.encryptionAlgorithm, key, iv);

      const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(data), "utf8"),
        cipher.final(),
      ]);

      return {
        iv: iv.toString("hex"),
        encryptedData: encrypted.toString("hex"),
        salt: this.encryptionSalt,
      };
    } catch (error) {
      logger.error("Encryption failed", {
        error,
        requestId: this.requestId,
      });
      return data;
    }
  }

  build(): ApiResponse {
    const success = this.statusCode >= 200 && this.statusCode < 300;
    const [seconds, nanoseconds] = process.hrtime(this.startTime);
    const responseTimeMs = Math.round(seconds * 1000 + nanoseconds / 1e6);

    return {
      success,
      status: {
        code: this.statusCode,
        description: STATUS_MESSAGES[this.statusCode] || "Unknown Status",
      },
      message:
        this.message ||
        STATUS_MESSAGES[this.statusCode] ||
        "Request processed.",
      timestamp: new Date().toISOString(),
      responseTimeMs,
      requestId: this.requestId,
      locale: this.locale,
      data:
        this.data !== null
          ? this.enableEncryption
            ? this.encryptData(this.data)
            : this.data
          : null,
      meta: Object.keys(this.meta).length > 0 ? this.meta : undefined,
      error: this.error || null,
      requestContext: this.requestContext || null,
    };
  }
}

export const responseBuilder = new ResponseBuilderService();
