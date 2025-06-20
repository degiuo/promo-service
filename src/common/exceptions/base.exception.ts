export interface ErrorContext {
  [key: string]: any;
}

export class BaseServiceException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: ErrorContext,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
} 