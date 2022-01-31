import { HttpClient, Response } from '../src';
export declare class CachingHttpClient implements HttpClient {
    private cacheDir;
    private client;
    constructor(cacheDir: string, client?: HttpClient);
    cachePath(p: string): string;
    readCache<T>(path: string): Promise<Response<T> | undefined>;
    writeCache<T>(path: string, data: T): Promise<void>;
    get<T>(path: string): Promise<Response<T>>;
    withBaseUrl(baseUrl: string): HttpClient;
}
//# sourceMappingURL=CachingHttpClient.d.ts.map