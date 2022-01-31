import { Unspent } from '@bitgo/utxo-lib/dist/src/bitgo';
import { AddressApi, AddressInfo } from '../AddressApi';
import { UtxoApi } from '../UtxoApi';
import { HttpClient } from '../BaseHttpClient';
export declare class BlockstreamApi implements AddressApi, UtxoApi {
    client: HttpClient;
    static forCoin(coinName: string, params?: {
        httpClient?: HttpClient;
    }): BlockstreamApi;
    constructor(client: HttpClient);
    getAddressInfo(address: string): Promise<AddressInfo>;
    getUnspentsForAddresses(addrs: string[]): Promise<Unspent[]>;
    getTransactionHex(txid: string): Promise<string>;
    getTransactionInputs(txid: string): Promise<Unspent[]>;
}
//# sourceMappingURL=BlockstreamApi.d.ts.map