import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { Request, Response } from "express";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  private safeStringify(obj: any, maxLength = 500): string {
    try {
      if (!obj) return "null";

      // Handle primitive types
      if (typeof obj !== "object") {
        return String(obj);
      }

      // Use a replacer to handle circular references
      const seen = new WeakSet();
      const str = JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }
        return value;
      });

      return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
    } catch (error) {
      return "[Unable to stringify]";
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, body, headers } = request;
    const userAgent = headers["user-agent"] || "Unknown";
    const ip = request.ip || request.socket.remoteAddress;

    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `📥 Incoming Request: ${method} ${url} | IP: ${ip} | User-Agent: ${userAgent}`
    );

    if (Object.keys(body || {}).length > 0) {
      this.logger.debug(`Request Body: ${this.safeStringify(body)}`);
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log successful response
        this.logger.log(
          `📤 Response Sent: ${method} ${url} | Status: ${statusCode} | Duration: ${duration}ms`
        );

        if (data) {
          this.logger.debug(`Response Data: ${this.safeStringify(data)}`);
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log error response
        this.logger.error(
          `❌ Error Response: ${method} ${url} | Status: ${statusCode} | Duration: ${duration}ms`
        );
        this.logger.error(`Error Message: ${error.message}`);

        if (error.stack) {
          this.logger.debug(`Error Stack: ${error.stack}`);
        }

        throw error;
      })
    );
  }
}
