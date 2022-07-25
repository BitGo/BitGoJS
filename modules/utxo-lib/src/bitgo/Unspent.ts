import { TxOutput } from 'bitcoinjs-lib';
import { Network } from '..';
import { toOutputScript } from '../address';
import { UtxoTransactionBuilder } from './UtxoTransactionBuilder';
import { toTNumber } from './tnumber';

/**
 * Public unspent data in BitGo-specific representation.
 */
export interface Unspent<TNumber extends number | bigint = number> {
  /**
   * Format: ${txid}:${vout}.
   * Use `parseOutputId(id)` to parse.
   */
  id: string;
  /**
   * The network-specific encoded address.
   * Use `toOutputScript(address, network)` to obtain scriptPubKey.
   */
  address: string;
  /**
   * The amount in satoshi.
   */
  value: TNumber;
}

/**
 * @return TxOutput from Unspent
 */
export function toOutput<TNumber extends number | bigint>(u: Unspent<TNumber>, network: Network): TxOutput<TNumber> {
  return {
    script: toOutputScript(u.address, network),
    value: u.value,
  };
}

/**
 * @param outputId
 * @return TxOutPoint
 */
export function parseOutputId(outputId: string): TxOutPoint {
  const parts = outputId.split(':');
  if (parts.length !== 2) {
    throw new Error(`invalid outputId, must have format txid:vout`);
  }
  const [txid, voutStr] = parts;
  const vout = Number(voutStr);
  if (txid.length !== 64) {
    throw new Error(`invalid txid ${txid} ${txid.length}`);
  }
  if (Number.isNaN(vout) || vout < 0 || !Number.isSafeInteger(vout)) {
    throw new Error(`invalid vout: must be integer >= 0`);
  }
  return { txid, vout };
}

/**
 * @param txid
 * @param vout
 * @return outputId
 */
export function formatOutputId({ txid, vout }: TxOutPoint): string {
  return `${txid}:${vout}`;
}

export function getOutputIdForInput(i: { hash: Buffer; index: number }): TxOutPoint {
  return {
    txid: Buffer.from(i.hash).reverse().toString('hex'),
    vout: i.index,
  };
}

/**
 * Reference to output of an existing transaction
 */
export type TxOutPoint = {
  txid: string;
  vout: number;
};

/**
 * Output reference and script data.
 * Suitable for use for `txb.addInput()`
 */
export type PrevOutput<TNumber extends number | bigint = number> = TxOutPoint & TxOutput<TNumber>;

/**
 * @return PrevOutput from Unspent
 */
export function toPrevOutput<TNumber extends number | bigint>(
  u: Unspent<TNumber>,
  network: Network
): PrevOutput<TNumber> {
  return {
    ...parseOutputId(u.id),
    ...toOutput(u, network),
  };
}

/**
 * @param txb
 * @param u
 * @param sequence - sequenceId
 */
export function addToTransactionBuilder<TNumber extends number | bigint>(
  txb: UtxoTransactionBuilder<TNumber>,
  u: Unspent<TNumber>,
  sequence?: number
): void {
  const { txid, vout, script, value } = toPrevOutput(u, txb.network as Network);
  txb.addInput(txid, vout, sequence, script, value);
}

export function unspentSum<TNumber extends number | bigint>(
  unspents: Unspent<TNumber>[],
  sumType: 'inherit' | 'number' | 'bigint' = 'inherit'
): TNumber {
  if (unspents.length === 0 && sumType === 'inherit') {
    throw new Error(`invalid sumType for empty unspents`);
  }

  if (sumType === 'inherit') {
    const t = typeof unspents[0].value;
    if (t === 'number' || t === 'bigint') {
      sumType = t;
    } else {
      throw new Error(`invalid unspent value type`);
    }
  }

  const total = unspents.reduce((sum, u) => {
    if (typeof u.value !== typeof unspents[0].value) {
      throw new TypeError(`unspent values must be of same type`);
    }
    return sum + BigInt(u.value);
  }, BigInt(0));

  return toTNumber(total, sumType) as TNumber;
}
