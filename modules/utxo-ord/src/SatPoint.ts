/*

https://github.com/casey/ord/blob/master/bip.mediawiki#terminology-and-notation

> A satpoint may be used to indicate the location of a sat within an output.
> A satpoint consists of an outpoint, i.e., a transaction ID and output index, with the addition of
> the offset of the ordinal within that output. For example, if the sat in question is at offset 6
> in the first output of a transaction, its satpoint is:
> `680df1e4d43016571e504b0b142ee43c5c0b83398a97bdcfd94ea6f287322d22:0:6`

*/
import { bitgo } from '@bitgo/utxo-lib';

export type SatPoint = `${string}:${number}:${bigint}`;

export function parseSatPoint(p: SatPoint): { txid: string; vout: number; offset: bigint } {
  const parts = p.split(':');
  if (parts.length !== 3) {
    throw new Error(`expected format txid:vout:sat`);
  }
  const [txid, vout, offsetStr] = parts;
  const offset = BigInt(offsetStr);
  if (offset.toString() !== offsetStr) {
    throw new Error(`SatPoint offset must be base-10`);
  }
  if (offset < 0) {
    throw new Error(`SatPoint offset must be positive`);
  }
  return {
    ...bitgo.parseOutputId([txid, vout].join(':')),
    offset,
  };
}

export function formatSatPoint(p: { txid: string; vout: number; offset: bigint }): SatPoint {
  return `${p.txid}:${p.vout}:${p.offset}` as const;
}

export function isSatPoint(v: string): v is SatPoint {
  try {
    parseSatPoint(v as SatPoint);
    return true;
  } catch {
    return false;
  }
}
