import { UtxoApi } from './UtxoApi';
import { HttpClient } from './BaseHttpClient';

export class ApiNotImplementedError extends Error {
  constructor(coinName: string) {
    super(`api not implemented for coin ${coinName}`);
  }
}

export interface ApiBuilder<T> {
  name: string;
  forCoin(coinName: string, params?: { httpClient?: HttpClient }): T;
}

export function supportsCoin(builder: ApiBuilder<UtxoApi>, coinName: string): boolean {
  try {
    builder.forCoin(coinName);
    return true;
  } catch (e) {
    if (e instanceof ApiNotImplementedError) {
      return false;
    }
    throw e;
  }
}
