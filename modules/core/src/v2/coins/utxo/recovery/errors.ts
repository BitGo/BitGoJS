/**
 * @prettier
 */
import { BitGoJsError } from '../../../../errors';

export class ApiNotImplementedError extends BitGoJsError {
  constructor(coinName: string) {
    super(`api not implemented for coin ${coinName}`);
  }
}

export class ApiRequestError extends BitGoJsError {
  constructor(url: string, reason: Error | string) {
    super(`error in API request: ${url}: ${reason}`);
  }
}
