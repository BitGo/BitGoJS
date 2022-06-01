import { BitGoJsError } from '../bigojsError';

export class AddressGenerationError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address generation failed');
  }
}

export class EthereumLibraryUnavailableError extends BitGoJsError {
  public constructor(packageName: string) {
    super(`Ethereum library required for operation is not available. Please install "${packageName}".`);
  }
}

export class MethodNotImplementedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'method not implemented');
  }
}
