import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

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
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

@Injectable()
export class ResponseBuilderService {
  private readonly logger = new Logger(ResponseBuilderService.name);
  private encryptionSecret?: string;
  private encryptionSalt?: string;
  private encryptionAlgorithm = "aes-256-cbc";
  private enableEncryption: boolean;

  constructor(private configService: ConfigService) {
    this.enableEncryption =
      this.configService.get("ENABLE_ENCRYPTION") === "true";

    if (this.enableEncryption) {
      this.encryptionSecret = this.configService.get("ENCRYPTION_KEY");
      this.encryptionSalt = this.configService.get("ENCRYPTION_SALT");

      if (!this.encryptionSecret || !this.encryptionSalt) {
        this.logger.warn(
          "Encryption enabled but ENCRYPTION_KEY or ENCRYPTION_SALT not provided"
        );
        this.enableEncryption = false;
      }
    }
  }

  /**
   * Create a new response builder instance
   */
  createBuilder(requestId: string): ResponseBuilder {
    return new ResponseBuilder(
      requestId,
      this.enableEncryption,
      this.encryptionSecret,
      this.encryptionSalt,
      this.encryptionAlgorithm,
      this.logger
    );
  }

  /**
   * Encrypts data using AES-256-CBC algorithm with scrypt key derivation
   */
  encryptData(data: any): any {
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
      this.logger.error("Encryption failed", error);
      return data;
    }
  }

  /**
   * Decrypts data using AES-256-CBC algorithm with scrypt key derivation
   */
  decryptData(encryptedPayload: {
    iv: string;
    encryptedData: string;
    salt: string;
  }): any {
    if (!this.encryptionSecret) {
      throw new Error("Encryption secret not configured");
    }

    try {
      const key = crypto.scryptSync(
        this.encryptionSecret,
        encryptedPayload.salt,
        32
      );
      const decipher = crypto.createDecipheriv(
        this.encryptionAlgorithm,
        key,
        Buffer.from(encryptedPayload.iv, "hex")
      );

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedPayload.encryptedData, "hex")),
        decipher.final(),
      ]);

      return JSON.parse(decrypted.toString("utf8"));
    } catch (error) {
      this.logger.error("Decryption failed", error);
      throw new Error("Decryption failed");
    }
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
    private enableEncryption: boolean,
    private encryptionSecret?: string,
    private encryptionSalt?: string,
    private encryptionAlgorithm = "aes-256-cbc",
    private logger?: Logger
  ) {
    this.requestId = requestId;
    this.startTime = process.hrtime();
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

  /**
   * Encrypts data using AES-256-CBC algorithm
   */
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
      this.logger?.error("Encryption failed", {
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
