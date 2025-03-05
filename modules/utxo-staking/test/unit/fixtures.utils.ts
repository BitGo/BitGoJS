import { Descriptor } from '@bitgo/wasm-miniscript';
import * as utxolib from '@bitgo/utxo-lib';
import * as bitcoinjslib from 'bitcoinjs-lib';
import { toPlainObjectFromTx, toPlainObjectFromPsbt } from '@bitgo/utxo-core/testutil/descriptor';

export function normalize(v: unknown): unknown {
  if (typeof v === 'bigint') {
    return v.toString();
  }
  if (v instanceof Descriptor) {
    return v.toString();
  }
  if (v instanceof Buffer) {
    return v.toString('hex');
  }
  if (v instanceof bitcoinjslib.Psbt) {
    v = utxolib.Psbt.fromBuffer(v.toBuffer());
  }
  if (v instanceof utxolib.Psbt) {
    return toPlainObjectFromPsbt(v);
  }
  if (v instanceof utxolib.Transaction) {
    return toPlainObjectFromTx(v);
  }
  if (Array.isArray(v)) {
    return v.map(normalize);
  }
  if (typeof v === 'object' && v !== null) {
    return Object.fromEntries(Object.entries(v).flatMap(([k, v]) => (v === undefined ? [] : [[k, normalize(v)]])));
  }
  return v;
}
