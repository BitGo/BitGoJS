import { UtxoApi } from './UtxoApi';
import { HttpClient } from './BaseHttpClient';
export declare class ApiNotImplementedError extends Error {
    constructor(coinName: string);
}
export interface ApiBuilder<T> {
    name: string;
    forCoin(coinName: string, params?: {
        httpClient?: HttpClient;
    }): T;
}
export declare function supportsCoin(builder: ApiBuilder<UtxoApi>, coinName: string): boolean;
//# sourceMappingURL=ApiBuilder.d.ts.map