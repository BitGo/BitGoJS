import { Unspent } from '@bitgo/utxo-lib/dist/src/bitgo';
import { HttpClient, Response } from '../BaseHttpClient';
import { AddressApi, AddressInfo } from '../AddressApi';
import { UtxoApi } from '../UtxoApi';
declare type BlockchairUnspent = {
    transaction_hash: string;
    index: number;
    recipient: string;
    value: number;
    block_id: number;
};
declare type BlockchairTransaction = {
    transaction: unknown;
    inputs: BlockchairUnspent[];
    outputs: BlockchairUnspent[];
};
export declare class BlockchairApi implements AddressApi, UtxoApi {
    client: HttpClient;
    protected readonly apiToken?: string;
    static forCoin(coinName: string, params?: {
        apiToken?: string;
        httpClient?: HttpClient;
    }): BlockchairApi;
    constructor(client: HttpClient, apiToken?: string);
    get<T>(path: string): Promise<Response<T>>;
    getAddressInfo(address: string): Promise<AddressInfo>;
    getUnspentsForAddresses(addr: string[]): Promise<Unspent[]>;
    getTransaction(txid: string): Promise<BlockchairTransaction>;
    getTransactionInputs(txid: string): Promise<Unspent[]>;
    getTransactionHex(txid: string): Promise<string>;
}
export {};
//# sourceMappingURL=BlockchairApi.d.ts.map