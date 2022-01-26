import * as superagent from 'superagent';
import * as Bluebird from 'bluebird';

export class ApiRequestError extends Error {
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

export interface HttpClient {
  withBaseUrl(baseUrl: string): HttpClient;
  get<T>(path: string): Promise<Response<T>>;
}

export function mapSeries<T, U>(arr: T[], f: (v: T, i: number) => Promise<U>): Promise<U[]> {
  return Bluebird.mapSeries(arr, f);
}

export class BaseHttpClient implements HttpClient {
  constructor(public baseUrl?: string) {
    if (baseUrl) {
      if (!baseUrl.startsWith('https://')) {
        throw new Error(`baseUrl must start with https://`);
      }
      if (baseUrl.endsWith(`/`)) {
        throw new Error(`baseUrl must not end with slash (/)`);
      }
    }
  }

  withBaseUrl(baseUrl: string): BaseHttpClient {
    return new BaseHttpClient(baseUrl);
  }

  async request<T>(method: 'get' | 'post', path: string, requestBody: unknown | undefined): Promise<Response<T>> {
    if (!path.startsWith(path)) {
      throw new Error(`path must start with '/' character`);
    }
    if (!this.baseUrl) {
      throw new Error(`no baseUrl set`);
    }
    const url = this.baseUrl + path;
    let response: superagent.Response;
    try {
      response = await superagent(method, url).send(requestBody as Record<string, unknown>);
    } catch (e) {
      console.error(e);
      throw new ApiRequestError(url, e as Error);
    }
    if (!response.ok) {
      throw new ApiRequestError(url, `status code ${response.statusCode}`);
    }

    let body: T;
    switch (response.type) {
      case 'application/json':
        body = response.body;
        break;
      case 'text/plain':
        body = response.text as unknown as T;
        break;
      default:
        throw new ApiRequestError(url, `unexpected response content-type ${response.type}`);
    }

    return {
      map<V>(f: (body: T) => V): V {
        try {
          return f(body);
        } catch (e) {
          throw new ApiRequestError(url, e as Error);
        }
      },
    };
  }

  async get<T>(path: string): Promise<Response<T>> {
    return this.request('get', path, undefined);
  }
}
