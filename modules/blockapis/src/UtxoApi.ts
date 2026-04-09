import * as utxolib from '@bitgo/utxo-lib';
import { mapSeries } from './BaseHttpClient';
import { TransactionApi } from './TransactionApi';

export type OutputSpend =
  | {
      txid: string;
      vin: number;
    }
  | { txid: undefined; vin: undefined };

export type TransactionIO = {
  inputs: { address: string }[];
  outputs: { address: string }[];
};

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
   * @param txid
   * @return transaction input and output addresses
   */
  getTransactionIO(txid: string): Promise<TransactionIO>;

  /**
   * @param txid
   */
  getTransactionSpends(txid: string): Promise<OutputSpend[]>;

  /**
   * @param address
   * @return unspent outputs for addresses
   */
  getUnspentsForAddresses(address: string[]): Promise<utxolib.bitgo.Unspent[]>;
}

/**
 * Helper to efficiently fetch output data.
 * Typical we can query output data for all outputs of a transaction, so we first fetch all
 * the output list via `f` and then pick the output data from the result.
 * @param outpoints
 * @param f - maps txid to a list of outputs with type TOut
 * @return list of TOut corresponding to outputs
 */
async function mapInputs<TOut>(
  outpoints: utxolib.bitgo.TxOutPoint[],
  f: (txid: string) => Promise<TOut[]>
): Promise<TOut[]> {
  const txids = [...new Set(outpoints.map((i) => i.txid))];
  const txMap = new Map(await mapSeries(txids, async (txid) => [txid, await f(txid)]));
  return outpoints.map((i) => {
    const arr = txMap.get(i.txid);
    if (arr) {
      if (i.vout in arr) {
        return arr[i.vout];
      }
      throw new Error(`could not find output ${i.vout}`);
    }
    throw new Error(`could not find tx ${i.txid}`);
  });
}

/**
 * Fetch transaction inputs from transaction input list
 * @param ins
 * @param api
 * @param network
 */
export async function fetchInputs(
  ins: utxolib.TxInput[] | utxolib.bitgo.TxOutPoint[],
  api: UtxoApi,
  network: utxolib.Network
): Promise<utxolib.TxOutput[]> {
  return mapInputs(
    ins.map((i: utxolib.TxInput | utxolib.bitgo.TxOutPoint) => {
      if ('txid' in i) {
        return i;
      }
      return utxolib.bitgo.getOutputIdForInput(i);
    }),
    async (txid) => utxolib.bitgo.createTransactionFromHex(await api.getTransactionHex(txid), network).outs
  );
}

/**
 * Fetch transaction spend status outpoints.
 */
export async function fetchTransactionSpends(
  outpoints: utxolib.bitgo.TxOutPoint[],
  api: UtxoApi
): Promise<OutputSpend[]> {
  return mapInputs(outpoints, async (txid) => await api.getTransactionSpends(txid));
}
