/**
 * @prettier
 */
import * as superagent from 'superagent';
import { BitGoJsError } from '@bitgo/sdk-core';

export class ApiNotImplementedError extends BitGoJsError {
  constructor(coinName: string) {
    super(`api not implemented for coin ${coinName}`);
  }
}

export class ApiRequestError extends BitGoJsError {
  constructor(url: string, reason: Error | string) {
    super(`error in API request: ${url}: ${reason}`);
  }

  static forRequest(req: superagent.Request, reason: Error | string): ApiRequestError {
    return new ApiRequestError(req.toString(), reason);
  }

  static forResponse(res: superagent.Response, reason: Error | string): ApiRequestError {
    return new ApiRequestError(res.header, reason);
  }
}

export type RequestOptions = {
  retry?: number;
};

export type Response<T> = {
  map<V>(f: (body: T) => V): V;
};

export class BaseApi {
  constructor(public baseUrl: string) {
    if (!baseUrl.startsWith('https://')) {
      throw new Error(`baseUrl must start with https://`);
    }
    if (baseUrl.endsWith(`/`)) {
      throw new Error(`baseUrl must not end with slash (/)`);
    }
  }

  async request<T>(
    method: string,
    path: string,
    requestBody: unknown | undefined,
    params: RequestOptions = {}
  ): Promise<Response<T>> {
    if (!path.startsWith(path)) {
      throw new Error(`path must start with '/' character`);
    }
    const url = this.baseUrl + path;
    let response;
    try {
      response = await superagent(method, url)
        .retry(params.retry)
        .send(requestBody as Record<string, unknown>);
    } catch (e) {
      throw new ApiRequestError(url, e);
    }
    if (!response.ok) {
      throw new ApiRequestError(url, `status code ${response.statusCode}`);
    }

    return {
      map<V>(f: (body: T) => V): V {
        try {
          return f(response.body);
        } catch (e) {
          throw new ApiRequestError(url, e);
        }
      },
    };
  }

  get<T>(path: string, params?: RequestOptions): Promise<Response<T>> {
    return this.request('get', path, undefined, params);
  }

  post<T>(path: string, body: unknown, params?: RequestOptions): Promise<Response<T>> {
    return this.request('post', path, body, params);
  }
}
