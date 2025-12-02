export interface ServiceResponse {
  success: boolean;
  status: {
    code: number;
    description: string;
  };
  message?: string;
  timestamp: string;
  responseTimeMs: number;
  requestId: string;
  locale: string;
  data?: any;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  requestContext?: {
    path?: string;
    method?: string;
  };
  meta?: Record<string, any>;
}

export class ResponseBuilder {
  private response: Partial<ServiceResponse>;
  private startTime: number;

  constructor(requestId: string) {
    this.startTime = Date.now();
    this.response = {
      success: true,
      requestId,
      timestamp: new Date().toISOString(),
      locale: "en-US",
      responseTimeMs: 0,
    };
  }

  status(code: number): this {
    this.response.status = {
      code,
      description: this.getStatusDescription(code),
    };
    this.response.success = code >= 200 && code < 300;
    return this;
  }

  withMessage(message: string): this {
    this.response.message = message;
    return this;
  }

  withData(data: any): this {
    this.response.data = data;
    return this;
  }

  withError(message: string, code: string, details?: any): this {
    this.response.error = { message, code, details };
    this.response.success = false;
    return this;
  }

  withRequestContext(context: { path?: string; method?: string }): this {
    this.response.requestContext = context;
    return this;
  }

  withMeta(meta: Record<string, any>): this {
    this.response.meta = meta;
    return this;
  }

  build(): ServiceResponse {
    this.response.responseTimeMs = Date.now() - this.startTime;
    return this.response as ServiceResponse;
  }

  private getStatusDescription(code: number): string {
    const descriptions: Record<number, string> = {
      200: "OK",
      201: "Created",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      409: "Conflict",
      500: "Internal Server Error",
    };
    return descriptions[code] || "Unknown";
  }
}
