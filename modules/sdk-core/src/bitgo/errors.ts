import { BitGoJsError } from '../bigojsError';

export class AddressGenerationError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address generation failed');
  }
}

export class MethodNotImplementedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'method not implemented');
  }
}
