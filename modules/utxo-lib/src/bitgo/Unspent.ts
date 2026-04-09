import { TxOutput } from 'bitcoinjs-lib';
import { Network } from '..';
import { fromOutputScript, toOutputScript } from '../address';
import { UtxoTransactionBuilder } from './UtxoTransactionBuilder';
import { UtxoTransaction } from './UtxoTransaction';

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

export interface UnspentWithPrevTx<TNumber extends number | bigint = number> extends Unspent<TNumber> {
  prevTx: Buffer;
}

export function isUnspentWithPrevTx<TNumber extends number | bigint, TUnspent extends Unspent<TNumber>>(
  u: Unspent<TNumber>
): u is TUnspent & { prevTx: Buffer } {
  return Buffer.isBuffer((u as UnspentWithPrevTx<TNumber>).prevTx);
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
 * @return Unspent from TxOutput
 */
export function fromOutput<TNumber extends number | bigint>(
  tx: UtxoTransaction<TNumber>,
  vout: number
): Unspent<TNumber> {
  const o = tx.outs[vout];
  if (!o) {
    throw new Error(`invalid vout`);
  }
  return {
    id: formatOutputId({ txid: tx.getId(), vout }),
    address: fromOutputScript(o.script, tx.network),
    value: o.value,
  };
}

export function fromOutputWithPrevTx<TNumber extends number | bigint>(
  tx: UtxoTransaction<TNumber>,
  vout: number
): UnspentWithPrevTx<TNumber> {
  return {
    ...fromOutput(tx, vout),
    prevTx: tx.toBuffer(),
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
export type PrevOutput<TNumber extends number | bigint = number> = TxOutPoint &
  TxOutput<TNumber> & {
    prevTx?: Buffer;
  };

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
 * @return PrevOutput with prevTx from Unspent
 */
export function toPrevOutputWithPrevTx<TNumber extends number | bigint>(
  u: Unspent<TNumber> & { prevTx?: unknown },
  network: Network
): PrevOutput<TNumber> {
  let prevTx;
  if (typeof u.prevTx === 'string') {
    prevTx = Buffer.from(u.prevTx, 'hex');
  } else if (Buffer.isBuffer(u.prevTx)) {
    prevTx = u.prevTx;
  } else if (u.prevTx !== undefined) {
    throw new Error(`Invalid prevTx type for unspent ${u.prevTx}`);
  }
  return {
    ...parseOutputId(u.id),
    ...toOutput(u, network),
    prevTx,
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

/**
 * Sum the values of the unspents.
 * Throws error if sum is not a safe integer value, or if unspent amount types do not match `amountType`
 * @param unspents - array of unspents to sum
 * @param amountType - expected value type of unspents
 * @return unspentSum - type matches amountType
 */
export function unspentSum<TNumber extends number | bigint>(
  unspents: { value: TNumber }[],
  amountType: 'number' | 'bigint' = 'number'
): TNumber {
  if (amountType === 'bigint') {
    return unspents.reduce((sum, u) => sum + (u.value as bigint), BigInt(0)) as TNumber;
  } else {
    const sum = unspents.reduce((sum, u) => sum + (u.value as number), Number(0));
    if (!Number.isSafeInteger(sum)) {
      throw new Error('unspent sum is not a safe integer number, consider using bigint');
    }
    return sum as TNumber;
  }
}
