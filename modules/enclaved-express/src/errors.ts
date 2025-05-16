/**
 * @prettier
 */

/**
 * Common base error class for the Enclaved Express application
 */
export class EnclavedError extends Error {
  public status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error for API responses
 */
export class ApiResponseError extends EnclavedError {
  public result: any;

  constructor(message: string, status = 500, result?: any) {
    super(message, status);
    this.result = result;
  }
}

/**
 * Error for configuration issues
 */
export class ConfigurationError extends EnclavedError {
  constructor(message: string) {
    super(message, 500);
  }
}

/**
 * Error for service connection issues
 */
export class ServiceConnectionError extends EnclavedError {
  constructor(message: string) {
    super(message, 502);
  }
}

/**
 * Error for unsupported operations
 */
export class UnsupportedOperationError extends EnclavedError {
  constructor(message: string) {
    super(message, 400);
  }
}
