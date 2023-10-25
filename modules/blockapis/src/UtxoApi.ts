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

function toOutPoints(arr: utxolib.TxInput[] | utxolib.bitgo.TxOutPoint[]): utxolib.bitgo.TxOutPoint[] {
  return arr.map((i) => {
    if ('txid' in i) {
      return i;
    }
    return utxolib.bitgo.getOutputIdForInput(i);
  });
}

/**
 * Helper to efficiently fetch output data. Deduplicates transaction ids and only does one lookup per txid.
 * @param outpoints
 * @param f - lookup function for txid
 * @return list of T corresponding to outpoints
 */
async function mapInputs<T>(outpoints: utxolib.bitgo.TxOutPoint[], f: (txid: string) => Promise<T>): Promise<T[]> {
  const txids = [...new Set(outpoints.map((i) => i.txid))];
  const txMap = new Map(await mapSeries(txids, async (txid) => [txid, await f(txid)]));
  return outpoints.map((i) => {
    const v = txMap.get(i.txid);
    if (!v) {
      throw new Error(`could not find tx ${i.txid}`);
    }
    return v;
  });
}

/**
 * @param outpoints
 * @param f - maps txid to a list of TOut.
 * @return list of TOut corresponding to outpoints
 */
async function mapInputsVOut<TOut>(
  outpoints: utxolib.bitgo.TxOutPoint[],
  f: (txid: string) => Promise<TOut[]>
): Promise<TOut[]> {
  const allOutputs = await mapInputs(outpoints, f);
  return outpoints.map((p, i) => {
    const arr = allOutputs[i];
    if (p.vout in arr) {
      return allOutputs[i][p.vout];
    }
    throw new Error(`could not find output ${p.vout}`);
  });
}

export async function fetchPrevTxBuffers(
  ins: utxolib.TxInput[] | utxolib.bitgo.TxOutPoint[],
  api: UtxoApi,
  _network: utxolib.Network
): Promise<Buffer[]> {
  return mapInputs(toOutPoints(ins), async (txid) => Buffer.from(await api.getTransactionHex(txid), 'hex'));
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
  return mapInputsVOut(
    toOutPoints(ins),
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
  return mapInputsVOut(outpoints, async (txid) => await api.getTransactionSpends(txid));
}
