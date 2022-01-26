import * as utxolib from '@bitgo/utxo-lib';
import { mapSeries } from './BaseHttpClient';
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
export async function fetchInputs(
  ins: utxolib.TxInput[],
  api: UtxoApi,
  network: utxolib.Network
): Promise<utxolib.TxOutput[]> {
  const inputIds = ins.map((input) => utxolib.bitgo.getOutputIdForInput(input));
  const txids = [...new Set(inputIds.map((i) => i.txid))];
  const txMap = new Map(
    await mapSeries(txids, async (txid) => [
      txid,
      utxolib.bitgo.createTransactionFromHex(await api.getTransactionHex(txid), network),
    ])
  );
  return inputIds.map((i) => {
    const v = txMap.get(i.txid);
    if (v) {
      if (i.vout in v.outs) {
        return v.outs[i.vout];
      }
      throw new Error(`could not find output ${i.vout}`);
    }
    throw new Error(`could not find tx ${i.txid}`);
  });
}
