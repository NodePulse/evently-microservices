export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    messageOrErrorCode: string | (ErrorCodes & { details?: any }),
    statusCode?: number,
    code?: string,
    details?: any,
  ) {
    if (typeof messageOrErrorCode === 'object') {
      super(messageOrErrorCode.message);
      this.statusCode = messageOrErrorCode.code;
      this.code = messageOrErrorCode.name;
      this.details = messageOrErrorCode.details;
    } else {
      super(messageOrErrorCode);
      this.statusCode = statusCode || 500;
      this.code = code;
      this.details = details;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}
