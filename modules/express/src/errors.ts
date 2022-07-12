/**
 * @prettier
 */
// Descriptive error types for common issues which may arise
// during the operation of BitGoJS or BitGoExpress

// Each subclass needs the explicit Object.setPrototypeOf() so that instanceof will work correctly.
// See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work

import { BitGoJsError } from '@bitgo/sdk-core';

export class TlsConfigurationError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'TLS is configuration is invalid');
    Object.setPrototypeOf(this, TlsConfigurationError.prototype);
  }
}

export class NodeEnvironmentError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'NODE_ENV is invalid for the current bitgo environment');
    Object.setPrototypeOf(this, NodeEnvironmentError.prototype);
  }
}

export class ApiResponseError extends BitGoJsError {
  public readonly status: number;
  public readonly result: unknown;
  public constructor(message: string | undefined, status: number, result?: unknown) {
    super(message);
    Object.setPrototypeOf(this, ApiResponseError.prototype);
    this.status = status;
    this.result = result;
  }
}

export class IpcError extends BitGoJsError {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, IpcError.prototype);
  }
}

export class ExternalSignerConfigError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'External signer configuration is invalid');
  }
}
