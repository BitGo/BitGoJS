import * as utxolib from '@bitgo/utxo-lib';
import { TransactionApi } from './TransactionApi';
/**
 * Methods specific to UTXO-based blockchains
 */
export interface UtxoApi extends TransactionApi {
    /**
     * @param txid
     * @return transaction inputs
     */
    getTransactionInputs(txid: string): Promise<utxolib.bitgo.Unspent[]>;
    /**
     * @param address
     * @return unspent outputs for addresses
     */
    getUnspentsForAddresses(address: string[]): Promise<utxolib.bitgo.Unspent[]>;
}
/**
 * Fetch transaction inputs from transaction input list
 * @param ins
 * @param api
 * @param network
 */
export declare function fetchInputs(ins: utxolib.TxInput[], api: UtxoApi, network: utxolib.Network): Promise<utxolib.TxOutput[]>;
//# sourceMappingURL=UtxoApi.d.ts.map