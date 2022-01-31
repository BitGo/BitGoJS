import * as superagent from 'superagent';
export declare class ApiRequestError extends Error {
    constructor(url: string, reason: Error | string);
    static forRequest(req: superagent.Request, reason: Error | string): ApiRequestError;
    static forResponse(res: superagent.Response, reason: Error | string): ApiRequestError;
}
export declare type RequestOptions = {
    retry?: number;
};
export declare type Response<T> = {
    map<V>(f: (body: T) => V): V;
};
export interface HttpClient {
    withBaseUrl(baseUrl: string): HttpClient;
    get<T>(path: string): Promise<Response<T>>;
}
export declare function mapSeries<T, U>(arr: T[], f: (v: T, i: number) => Promise<U>): Promise<U[]>;
export declare class BaseHttpClient implements HttpClient {
    baseUrl?: string | undefined;
    constructor(baseUrl?: string | undefined);
    withBaseUrl(baseUrl: string): BaseHttpClient;
    request<T>(method: 'get' | 'post', path: string, requestBody: unknown | undefined): Promise<Response<T>>;
    get<T>(path: string): Promise<Response<T>>;
}
//# sourceMappingURL=BaseHttpClient.d.ts.map