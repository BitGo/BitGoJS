import { calculateRequestHeaders, calculateHMAC, verifyResponse } from './hmac';
import type {
  IHmacAuthStrategy,
  CalculateRequestHeadersOptions,
  RequestHeaders,
  VerifyResponseOptions,
  VerifyResponseInfo,
} from './types';

/**
 * Default HMAC auth strategy that wraps the existing synchronous Node.js crypto
 * functions. This is used when no custom strategy is provided to BitGoAPI.
 */
export class DefaultHmacAuthStrategy implements IHmacAuthStrategy {
  async calculateRequestHeaders(params: CalculateRequestHeadersOptions): Promise<RequestHeaders> {
    return calculateRequestHeaders(params);
  }

  async verifyResponse(params: VerifyResponseOptions): Promise<VerifyResponseInfo> {
    return verifyResponse(params);
  }

  async calculateHMAC(key: string, message: string): Promise<string> {
    return calculateHMAC(key, message);
  }
}
